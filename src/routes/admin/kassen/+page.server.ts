import { fail } from '@sveltejs/kit';
import { and, countDistinct, eq, isNull, or } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { audit } from '$lib/server/audit';
import { requireInstanceAdmin } from '$lib/server/admin';
import { kasseMembersOf } from '$lib/server/kassen';
import { shownName } from '$lib/server/display';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireInstanceAdmin(locals.user);
	const [kassen, persons, used] = await Promise.all([
		db.select().from(schema.kassen).where(isNull(schema.kassen.personalOf)).orderBy(schema.kassen.name),
		db.select({ id: schema.persons.id, name: shownName, lastLoginAt: schema.persons.lastLoginAt }).from(schema.persons),
		db
			.select({ kasseId: schema.memberships.kasseId, n: countDistinct(schema.memberships.groupId) })
			.from(schema.memberships)
			.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
			.where(isNull(schema.groups.deletedAt))
			.groupBy(schema.memberships.kasseId)
	]);
	const person = new Map(persons.map((p) => [p.id, p]));
	const usedIn = new Map(used.map((u) => [u.kasseId, u.n]));
	return {
		kassen: await Promise.all(
			kassen.map(async (k) => ({
				id: k.id,
				name: k.name,
				createdBy: k.createdBy ? (person.get(k.createdBy)?.name ?? '?') : null,
				groups: usedIn.get(k.id) ?? 0,
				members: (await kasseMembersOf(k.id)).map((m) => ({
					personId: m.personId,
					name: m.name,
					isManager: m.isManager,
					loggedIn: !!person.get(m.personId)?.lastLoginAt
				}))
			}))
		)
	};
};

export const actions: Actions = {
	/** Makes a member manager or takes it back (a Kasse with members keeps at least one manager). */
	manager: async ({ locals, request }) => {
		const user = requireInstanceAdmin(locals.user);
		const f = await request.formData();
		const kasseId = String(f.get('kasseId'));
		const personId = String(f.get('personId'));
		const members = await kasseMembersOf(kasseId);
		const target = members.find((m) => m.personId === personId);
		if (!target) return fail(404, { message: 'Person nicht in der Kasse.' });
		if (target.isManager && members.filter((m) => m.isManager).length <= 1) {
			return fail(400, { message: 'Die Kasse braucht mindestens einen Verwalter.' });
		}
		await db
			.update(schema.kasseMembers)
			.set({ isManager: !target.isManager })
			.where(and(eq(schema.kasseMembers.kasseId, kasseId), eq(schema.kasseMembers.personId, personId)));
		await audit(db, { groupId: null, personId: user.id, action: 'kasse.manager', entityId: kasseId, data: { personId, isManager: !target.isManager } });
		return { ok: true };
	},
	/** Only Kassen no group uses any more can be deleted. */
	delete: async ({ locals, request }) => {
		const user = requireInstanceAdmin(locals.user);
		const kasseId = String((await request.formData()).get('kasseId'));
		const [used] = await db.select({ g: schema.memberships.groupId }).from(schema.memberships).where(eq(schema.memberships.kasseId, kasseId)).limit(1);
		const [settled] = await db
			.select({ id: schema.settlements.id })
			.from(schema.settlements)
			.where(or(eq(schema.settlements.fromKasseId, kasseId), eq(schema.settlements.toKasseId, kasseId)))
			.limit(1);
		if (used || settled) return fail(400, { message: 'Die Kasse wird noch in Gruppen verwendet und kann nicht gelöscht werden.' });
		await db.delete(schema.kassen).where(and(eq(schema.kassen.id, kasseId), isNull(schema.kassen.personalOf)));
		await audit(db, { groupId: null, personId: user.id, action: 'kasse.delete', entityId: kasseId });
		return { ok: true };
	}
};
