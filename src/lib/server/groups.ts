import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { computeBalances, directTransfers, suggestTransfers } from '$lib/core/balance';
import type { Expense as CoreExpense, Member, SplitRule } from '$lib/core/types';
import { db, schema } from './db';
import type { SessionUser } from './auth/session';
import type { GroupSettings } from './db/schema';

export const defaultSettings: GroupSettings = {
	simplifyDebts: true,
	editOthers: 'all',
	membersCanAddPeople: true
};

export function requireUser(user: SessionUser | null): SessionUser {
	if (!user) error(401, 'Bitte melde dich an.');
	return user;
}

/** Loads a group the user is a member of, or fails with 404. */
export async function requireGroup(groupId: string, user: SessionUser | null) {
	const u = requireUser(user);
	const [row] = await db
		.select({ group: schema.groups, membership: schema.memberships })
		.from(schema.groups)
		.innerJoin(
			schema.memberships,
			and(eq(schema.memberships.groupId, schema.groups.id), eq(schema.memberships.personId, u.id))
		)
		.where(and(eq(schema.groups.id, groupId), isNull(schema.groups.deletedAt)))
		.limit(1);
	if (!row) error(404, 'Gruppe nicht gefunden.');
	return { ...row, isAdmin: row.membership.role === 'admin', user: u };
}

export async function requireGroupAdmin(groupId: string, user: SessionUser | null) {
	const g = await requireGroup(groupId, user);
	if (!g.isAdmin) error(403, 'Nur Gruppenadmins dürfen das.');
	return g;
}

export async function loadMembers(groupId: string) {
	return db
		.select({
			personId: schema.persons.id,
			name: schema.persons.name,
			color: schema.persons.color,
			avatarUrl: schema.persons.avatarUrl,
			role: schema.memberships.role,
			factor: schema.memberships.factor,
			tags: schema.memberships.tags,
			participationFrom: schema.memberships.participationFrom,
			participationTo: schema.memberships.participationTo,
			kasseId: schema.memberships.kasseId,
			kasseName: schema.kassen.name,
			kassePersonal: schema.kassen.personalOf,
			joinedAt: schema.memberships.joinedAt
		})
		.from(schema.memberships)
		.innerJoin(schema.persons, eq(schema.persons.id, schema.memberships.personId))
		.innerJoin(schema.kassen, eq(schema.kassen.id, schema.memberships.kasseId))
		.where(eq(schema.memberships.groupId, groupId))
		.orderBy(asc(schema.persons.name));
}

export type GroupMember = Awaited<ReturnType<typeof loadMembers>>[number];

export async function loadCategories(groupId: string) {
	return db
		.select()
		.from(schema.categories)
		.where(or(isNull(schema.categories.groupId), eq(schema.categories.groupId, groupId)))
		.orderBy(asc(schema.categories.sort));
}

export async function loadProfiles(groupId: string) {
	return db
		.select()
		.from(schema.profiles)
		.where(eq(schema.profiles.groupId, groupId))
		.orderBy(asc(schema.profiles.sort), asc(schema.profiles.name));
}

export async function loadExpenses(groupId: string) {
	const rows = await db
		.select()
		.from(schema.expenses)
		.where(and(eq(schema.expenses.groupId, groupId), isNull(schema.expenses.deletedAt)))
		.orderBy(desc(schema.expenses.date), desc(schema.expenses.createdAt));
	const payers = rows.length
		? await db
				.select()
				.from(schema.expensePayers)
				.where(inArray(schema.expensePayers.expenseId, rows.map((r) => r.id)))
		: [];
	const files = rows.length
		? await db
				.select({ id: schema.attachments.id, expenseId: schema.attachments.expenseId, mime: schema.attachments.mime })
				.from(schema.attachments)
				.where(inArray(schema.attachments.expenseId, rows.map((r) => r.id)))
		: [];
	return rows.map((r) => ({
		...r,
		payers: payers.filter((p) => p.expenseId === r.id),
		attachments: files.filter((f) => f.expenseId === r.id).map((f) => ({ id: f.id, mime: f.mime }))
	}));
}

export type GroupExpense = Awaited<ReturnType<typeof loadExpenses>>[number];

export async function loadSettlements(groupId: string) {
	return db
		.select()
		.from(schema.settlements)
		.where(and(eq(schema.settlements.groupId, groupId), isNull(schema.settlements.deletedAt)))
		.orderBy(desc(schema.settlements.date), desc(schema.settlements.createdAt));
}

export function toCoreMember(m: GroupMember): Member {
	return {
		personId: m.personId,
		factor: m.factor,
		tags: m.tags,
		from: m.participationFrom ?? undefined,
		to: m.participationTo ?? undefined,
		kasseId: m.kasseId
	};
}

const fallbackRule: SplitRule = { type: 'all' };

export function toCoreExpense(
	e: GroupExpense,
	profiles: { id: string; rule: SplitRule }[]
): CoreExpense {
	const sign = e.type === 'income' ? -1 : 1;
	let rule = e.rule ?? profiles.find((p) => p.id === e.profileId)?.rule ?? fallbackRule;
	// exact amounts are stored in the expense currency; as weights they convert exactly into base
	if (rule.type === 'individual' && rule.mode === 'amounts') rule = { ...rule, mode: 'shares' };
	return {
		id: e.id,
		date: e.date,
		baseAmount: sign * e.baseAmount,
		privateAmount: sign * e.privateAmount,
		payers: e.payers.map((p) => ({ personId: p.personId, amount: p.amount })),
		rule,
		period:
			e.periodFrom && e.periodTo && e.periodUnit
				? { from: e.periodFrom, to: e.periodTo, unit: e.periodUnit }
				: undefined,
		frozenShares: e.frozenShares ?? undefined
	};
}

/** Everything needed to show balances and settlement suggestions of a group. */
export async function loadGroupState(groupId: string) {
	const [[group], members, expenses, settlements, profiles] = await Promise.all([
		db.select().from(schema.groups).where(eq(schema.groups.id, groupId)),
		loadMembers(groupId),
		loadExpenses(groupId),
		loadSettlements(groupId),
		loadProfiles(groupId)
	]);
	const coreMembers = members.map(toCoreMember);
	const coreExpenses = expenses.map((e) => toCoreExpense(e, profiles));
	const coreSettlements = settlements.map((s) => ({
		fromKasseId: s.fromKasseId,
		toKasseId: s.toKasseId,
		amount: s.amount
	}));
	const balances = computeBalances(coreMembers, coreExpenses, coreSettlements);
	const transfers = group.settings.simplifyDebts
		? suggestTransfers(new Map([...balances.kassen].map(([id, k]) => [id, k.balance])))
		: directTransfers(coreMembers, coreExpenses, coreSettlements);

	const kasseIds = [...new Set([...balances.kassen.keys(), ...settlements.flatMap((s) => [s.fromKasseId, s.toKasseId])])];
	const kassenRows = kasseIds.length
		? await db.select().from(schema.kassen).where(inArray(schema.kassen.id, kasseIds))
		: [];
	return {
		group,
		members,
		expenses,
		settlements,
		profiles,
		coreMembers,
		coreExpenses,
		balances,
		transfers,
		kassen: kassenRows
	};
}

export function canEditExpense(
	g: { isAdmin: boolean; group: { settings: GroupSettings } },
	userId: string,
	expense: { createdBy: string }
) {
	return g.isAdmin || g.group.settings.editOthers === 'all' || expense.createdBy === userId;
}
