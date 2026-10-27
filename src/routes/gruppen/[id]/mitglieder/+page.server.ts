import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull, or } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db, schema } from '$lib/server/db';
import { loadMembers, requireGroup } from '$lib/server/groups';
import { claimedPersonIds, createPerson, knownPersons, personalKasseId } from '$lib/server/persons';
import { createPersonalInvite } from '$lib/server/auth/invites';
import { audit } from '$lib/server/audit';
import { today } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function canAddPeople(g: Awaited<ReturnType<typeof requireGroup>>) {
	return g.isAdmin || g.group.settings.membersCanAddPeople;
}

export const load: PageServerLoad = async ({ parent, locals, params }) => {
	const data = await parent();
	const g = await requireGroup(params.id, locals.user);
	const ids = data.members.map((m) => m.personId);
	const claimed = await claimedPersonIds(ids);
	const known = (await knownPersons(g.user.id)).filter((p) => !ids.includes(p.id));
	return {
		claimed: [...claimed],
		known,
		canAddPeople: canAddPeople(g)
	};
};

function parseFactor(v: FormDataEntryValue | null) {
	const n = parseFloat(String(v ?? '1').replace(',', '.'));
	return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export const actions: Actions = {
	add: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!canAddPeople(g)) error(403, 'Du darfst keine Personen hinzufügen.');
		const f = await request.formData();
		const existingId = String(f.get('personId') ?? '');
		const name = String(f.get('name') ?? '').trim();
		const factor = parseFactor(f.get('factor'));
		if (factor === null) return fail(400, { message: 'Ungültiger Faktor.' });
		const join = String(f.get('join') ?? 'all');
		let from: string | null = null;
		if (join === 'today') from = today();
		if (join === 'date') {
			from = String(f.get('from') ?? '');
			if (!isDate(from)) return fail(400, { message: 'Bitte ein Datum angeben.' });
		}

		let personId: string;
		if (existingId) {
			const known = await knownPersons(g.user.id);
			if (!known.some((p) => p.id === existingId)) return fail(400, { message: 'Unbekannte Person.' });
			personId = existingId;
		} else {
			if (!name) return fail(400, { message: 'Bitte einen Namen angeben.' });
			personId = await createPerson(db, { name, createdBy: g.user.id });
		}
		const [already] = await db
			.select()
			.from(schema.memberships)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));
		if (already) return fail(400, { message: 'Diese Person ist schon Mitglied.' });

		// a person in exactly one shared Kasse uses it by default, otherwise the preferred one or the personal Kasse
		const shared = await db
			.select()
			.from(schema.kasseMembers)
			.innerJoin(schema.kassen, eq(schema.kassen.id, schema.kasseMembers.kasseId))
			.where(and(eq(schema.kasseMembers.personId, personId), isNull(schema.kassen.personalOf)));
		const kasseId =
			shared.length === 1
				? shared[0].kassen.id
				: (shared.find((s) => s.kasse_members.isPreferred)?.kassen.id ?? (await personalKasseId(db, personId)));

		await db.insert(schema.memberships).values({
			groupId: params.id,
			personId,
			factor,
			participationFrom: from,
			kasseId
		});
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.add', entityId: personId, data: { from } });
		return { added: personId };
	},

	update: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const f = await request.formData();
		const personId = String(f.get('personId'));
		const self = personId === g.user.id;
		if (!g.isAdmin && !self) error(403, 'Nur Gruppenadmins dürfen andere bearbeiten.');
		const factor = parseFactor(f.get('factor'));
		if (factor === null) return fail(400, { message: 'Ungültiger Faktor.' });
		const from = String(f.get('from') ?? '');
		const to = String(f.get('to') ?? '');
		if ((from && !isDate(from)) || (to && !isDate(to)) || (from && to && to < from)) {
			return fail(400, { message: 'Ungültiger Teilnahmezeitraum.' });
		}
		const values: Partial<typeof schema.memberships.$inferInsert> = {
			factor,
			participationFrom: from || null,
			participationTo: to || null
		};
		if (g.isAdmin && f.has('role')) {
			const role = f.get('role') === 'admin' ? 'admin' : 'member';
			if (role === 'member' && self) {
				const admins = (await loadMembers(params.id)).filter((m) => m.role === 'admin');
				if (admins.length <= 1) return fail(400, { message: 'Die Gruppe braucht mindestens einen Admin.' });
			}
			values.role = role;
		}
		await db
			.update(schema.memberships)
			.set(values)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));

		// names of placeholders (people who never logged in) can be fixed by admins
		const name = String(f.get('name') ?? '').trim();
		if (name && g.isAdmin) {
			const claimed = await claimedPersonIds([personId]);
			if (!claimed.has(personId) || self) {
				await db.update(schema.persons).set({ name }).where(eq(schema.persons.id, personId));
				await db.update(schema.kassen).set({ name }).where(eq(schema.kassen.personalOf, personId));
			}
		}
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.update', entityId: personId, data: values });
		return { updated: personId };
	},

	remove: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const personId = String((await request.formData()).get('personId'));
		if (!g.isAdmin) error(403);
		const paid = await db
			.select({ id: schema.expensePayers.expenseId })
			.from(schema.expensePayers)
			.innerJoin(schema.expenses, eq(schema.expenses.id, schema.expensePayers.expenseId))
			.where(and(eq(schema.expenses.groupId, params.id), eq(schema.expensePayers.personId, personId), isNull(schema.expenses.deletedAt)))
			.limit(1);
		const [membership] = await db
			.select()
			.from(schema.memberships)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));
		if (!membership) error(404);
		const settled = await db
			.select({ id: schema.settlements.id })
			.from(schema.settlements)
			.where(
				and(
					eq(schema.settlements.groupId, params.id),
					isNull(schema.settlements.deletedAt),
					or(eq(schema.settlements.fromKasseId, membership.kasseId), eq(schema.settlements.toKasseId, membership.kasseId))
				)
			)
			.limit(1);
		if (paid.length || settled.length) {
			return fail(400, {
				message: 'Diese Person hat Ausgaben bezahlt oder Zahlungen. Setze stattdessen das Ende ihres Teilnahmezeitraums.'
			});
		}
		if (personId === g.user.id) return fail(400, { message: 'Du kannst dich nicht selbst entfernen.' });
		await db
			.delete(schema.memberships)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.remove', entityId: personId });
		return { removed: personId };
	},

	invite: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!canAddPeople(g)) error(403);
		const personId = String((await request.formData()).get('personId'));
		const members = await loadMembers(params.id);
		if (!members.some((m) => m.personId === personId)) error(404);
		const claimed = await claimedPersonIds([personId]);
		if (claimed.has(personId) && !g.isAdmin) {
			return fail(400, { message: 'Diese Person ist bereits angemeldet. Nur Admins können einen neuen Link erzeugen.' });
		}
		const invite = await createPersonalInvite(personId, params.id, g.user.id);
		const qr = await QRCode.toString(invite.url, { type: 'svg', margin: 1, width: 220 });
		return { invite: { personId, url: invite.url, qr, expiresAt: invite.expiresAt.toISOString() } };
	}
};
