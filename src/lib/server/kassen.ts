import { error } from '@sveltejs/kit';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db, schema } from './db';
import { loadGroupState } from './groups';
import type { SessionUser } from './auth/session';

/** Shared Kassen (families, couples …) the person belongs to. */
export async function sharedKassenOf(personId: string) {
	return db
		.select({
			id: schema.kassen.id,
			name: schema.kassen.name,
			isManager: schema.kasseMembers.isManager,
			isPreferred: schema.kasseMembers.isPreferred
		})
		.from(schema.kasseMembers)
		.innerJoin(schema.kassen, eq(schema.kassen.id, schema.kasseMembers.kasseId))
		.where(and(eq(schema.kasseMembers.personId, personId), isNull(schema.kassen.personalOf)))
		.orderBy(schema.kassen.name);
}

export async function kasseMembersOf(kasseId: string) {
	return db
		.select({
			personId: schema.persons.id,
			name: schema.persons.name,
			color: schema.persons.color,
			avatarUrl: schema.persons.avatarUrl,
			isManager: schema.kasseMembers.isManager,
			isPreferred: schema.kasseMembers.isPreferred
		})
		.from(schema.kasseMembers)
		.innerJoin(schema.persons, eq(schema.persons.id, schema.kasseMembers.personId))
		.where(eq(schema.kasseMembers.kasseId, kasseId))
		.orderBy(schema.persons.name);
}

export async function requireKasse(kasseId: string, user: SessionUser | null) {
	if (!user) error(401, 'Bitte melde dich an.');
	const [kasse] = await db.select().from(schema.kassen).where(eq(schema.kassen.id, kasseId));
	if (!kasse || kasse.personalOf) error(404, 'Kasse nicht gefunden.');
	const members = await kasseMembersOf(kasseId);
	const me = members.find((m) => m.personId === user.id);
	if (!me) error(404, 'Kasse nicht gefunden.');
	return { kasse, members, isManager: me.isManager, user };
}

/**
 * Picks the Kasse a person settles with when joining a group:
 * a shared Kasse already used by others in this group, else the preferred one,
 * else the only shared one, else the personal Kasse.
 */
export async function pickKasseForGroup(personId: string, groupId: string, personalKasseId: string) {
	const shared = await sharedKassenOf(personId);
	if (!shared.length) return personalKasseId;
	const used = await db
		.selectDistinct({ kasseId: schema.memberships.kasseId })
		.from(schema.memberships)
		.where(
			and(
				eq(schema.memberships.groupId, groupId),
				inArray(
					schema.memberships.kasseId,
					shared.map((k) => k.id)
				)
			)
		);
	if (used.length) return used[0].kasseId;
	return (shared.find((k) => k.isPreferred) ?? (shared.length === 1 ? shared[0] : null))?.id ?? personalKasseId;
}

/** Balances of a Kasse in all groups it is used in, and netting suggestions across groups. */
export async function kasseOverview(kasseId: string) {
	const groupRows = await db
		.selectDistinct({ groupId: schema.memberships.groupId })
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.where(and(eq(schema.memberships.kasseId, kasseId), isNull(schema.groups.deletedAt)));

	const groups = [];
	// per counterparty and currency: positive = this Kasse receives money
	const net = new Map<string, { kasseId: string; currency: string; amount: number; parts: { groupId: string; amount: number }[] }>();
	const kasseNames = new Map<string, string>();
	for (const { groupId } of groupRows) {
		const state = await loadGroupState(groupId);
		for (const k of state.kassen) kasseNames.set(k.id, k.name);
		const balance = state.balances.kassen.get(kasseId);
		const transfers = state.transfers.filter((t) => t.from === kasseId || t.to === kasseId);
		groups.push({
			id: groupId,
			name: state.group.name,
			emoji: state.group.emoji,
			currency: state.group.baseCurrency,
			status: state.group.status,
			paid: balance?.paid ?? 0,
			consumed: balance?.consumed ?? 0,
			balance: balance?.balance ?? 0,
			transfers
		});
		for (const t of transfers) {
			const other = t.from === kasseId ? t.to : t.from;
			const signed = t.to === kasseId ? t.amount : -t.amount;
			const key = `${other}|${state.group.baseCurrency}`;
			const entry = net.get(key) ?? { kasseId: other, currency: state.group.baseCurrency, amount: 0, parts: [] };
			entry.amount += signed;
			entry.parts.push({ groupId, amount: signed });
			net.set(key, entry);
		}
	}
	const totals = new Map<string, number>();
	for (const g of groups) totals.set(g.currency, (totals.get(g.currency) ?? 0) + g.balance);
	return {
		groups,
		totals: [...totals].map(([currency, amount]) => ({ currency, amount })),
		// only interesting when a counterparty appears in more than one group
		netting: [...net.values()]
			.filter((n) => n.parts.length > 1)
			.map((n) => ({ ...n, name: kasseNames.get(n.kasseId) ?? '?' })),
		kasseNames: Object.fromEntries(kasseNames)
	};
}

export interface KasseSwitch {
	groupId: string;
	groupName: string;
	kasseName: string;
	names: string[];
}

/**
 * As soon as at least two people of a shared Kasse are in the same open group, they settle together:
 * members who still settle alone (personal Kasse) are switched to this Kasse. Settled and archived
 * groups stay as they are, and so does anyone who already uses another shared Kasse there or whose
 * personal Kasse already has payments in that group. Returns what was switched, for the user to see.
 */
export async function syncKasseToGroups(kasseId: string, onlyGroupId?: string): Promise<KasseSwitch[]> {
	const [kasse] = await db.select().from(schema.kassen).where(eq(schema.kassen.id, kasseId));
	if (!kasse || kasse.personalOf) return [];
	const members = await kasseMembersOf(kasseId);
	if (members.length < 2) return [];
	const rows = await db
		.select({
			groupId: schema.memberships.groupId,
			groupName: schema.groups.name,
			personId: schema.memberships.personId,
			kasseId: schema.memberships.kasseId,
			personalOf: schema.kassen.personalOf
		})
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.innerJoin(schema.kassen, eq(schema.kassen.id, schema.memberships.kasseId))
		.where(
			and(
				inArray(schema.memberships.personId, members.map((m) => m.personId)),
				eq(schema.groups.status, 'active'),
				isNull(schema.groups.deletedAt),
				onlyGroupId ? eq(schema.memberships.groupId, onlyGroupId) : undefined
			)
		);
	const byGroup = new Map<string, typeof rows>();
	for (const r of rows) byGroup.set(r.groupId, [...(byGroup.get(r.groupId) ?? []), r]);

	const names = new Map(members.map((m) => [m.personId, m.name]));
	const result: KasseSwitch[] = [];
	for (const [groupId, list] of byGroup) {
		if (list.length < 2) continue;
		// only those who settle alone; a personal Kasse with payments in this group must stay
		const candidates = list.filter((r) => r.kasseId !== kasseId && r.personalOf === r.personId);
		if (!candidates.length) continue;
		const paid = await db
			.selectDistinct({ from: schema.settlements.fromKasseId, to: schema.settlements.toKasseId })
			.from(schema.settlements)
			.where(and(eq(schema.settlements.groupId, groupId), isNull(schema.settlements.deletedAt)));
		const withPayments = new Set(paid.flatMap((p) => [p.from, p.to]));
		const switching = candidates.filter((r) => !withPayments.has(r.kasseId));
		if (!switching.length) continue;
		await db
			.update(schema.memberships)
			.set({ kasseId })
			.where(and(eq(schema.memberships.groupId, groupId), inArray(schema.memberships.personId, switching.map((r) => r.personId))));
		result.push({ groupId, groupName: list[0].groupName, kasseName: kasse.name, names: switching.map((r) => names.get(r.personId) ?? '?') });
	}
	return result;
}

/** syncKasseToGroups for all shared Kassen of a person (e.g. after joining a group). */
export async function syncPersonKassen(personId: string, onlyGroupId?: string) {
	const result: KasseSwitch[] = [];
	for (const k of await sharedKassenOf(personId)) result.push(...(await syncKasseToGroups(k.id, onlyGroupId)));
	return result;
}
