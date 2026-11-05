import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { audit } from '$lib/server/audit';
import { requireInstanceAdmin } from '$lib/server/admin';
import { loadGroupState, phaseOfState } from '$lib/server/groups';
import { shownName } from '$lib/server/display';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireInstanceAdmin(locals.user);
	const groups = await db.select().from(schema.groups).orderBy(schema.groups.createdAt);
	const creators = new Map(
		(await db.select({ id: schema.persons.id, name: shownName }).from(schema.persons)).map((p) => [p.id, p.name])
	);
	const list = await Promise.all(
		groups.map(async (g) => {
			const state = await loadGroupState(g.id);
			return {
				id: g.id,
				name: g.name,
				emoji: g.emoji,
				phase: phaseOfState(state),
				archived: !!g.archivedAt,
				deletedAt: g.deletedAt?.toISOString() ?? null,
				createdAt: g.createdAt.toISOString(),
				createdBy: creators.get(g.createdBy) ?? '?',
				expenses: state.expenses.length,
				members: state.members.map((m) => ({ personId: m.personId, name: m.name, role: m.role }))
			};
		})
	);
	return { groups: list.reverse() };
};

async function groupOf(id: string) {
	const [g] = await db.select().from(schema.groups).where(eq(schema.groups.id, id));
	return g;
}

export const actions: Actions = {
	/** Makes a member group admin or takes it back (a group keeps at least one admin). */
	role: async ({ locals, request }) => {
		const user = requireInstanceAdmin(locals.user);
		const f = await request.formData();
		const groupId = String(f.get('groupId'));
		const personId = String(f.get('personId'));
		const role = f.get('role') === 'admin' ? 'admin' : 'member';
		if (role === 'member') {
			const admins = await db
				.select({ id: schema.memberships.personId })
				.from(schema.memberships)
				.where(and(eq(schema.memberships.groupId, groupId), eq(schema.memberships.role, 'admin')));
			if (admins.length <= 1) return fail(400, { message: 'Die Gruppe braucht mindestens einen Gruppenadmin.' });
		}
		await db
			.update(schema.memberships)
			.set({ role })
			.where(and(eq(schema.memberships.groupId, groupId), eq(schema.memberships.personId, personId)));
		await audit(db, { groupId, personId: user.id, action: 'member.update', entityId: personId, data: { role, by: 'admin' } });
		return { ok: true };
	},
	archive: async ({ locals, request }) => {
		const user = requireInstanceAdmin(locals.user);
		const id = String((await request.formData()).get('groupId'));
		const g = await groupOf(id);
		if (!g) return fail(404, { message: 'Gruppe nicht gefunden.' });
		await db.update(schema.groups).set({ archivedAt: g.archivedAt ? null : new Date() }).where(eq(schema.groups.id, id));
		await audit(db, { groupId: id, personId: user.id, action: g.archivedAt ? 'group.unarchive' : 'group.archive' });
		return { ok: true };
	},
	/** Deleting goes to the bin (30 days), like a group admin would. */
	delete: async ({ locals, request }) => {
		const user = requireInstanceAdmin(locals.user);
		const id = String((await request.formData()).get('groupId'));
		const g = await groupOf(id);
		if (!g) return fail(404, { message: 'Gruppe nicht gefunden.' });
		await db.update(schema.groups).set({ deletedAt: g.deletedAt ? null : new Date() }).where(eq(schema.groups.id, id));
		await audit(db, { groupId: id, personId: user.id, action: g.deletedAt ? 'group.restore' : 'group.delete', entityId: id });
		return { ok: true };
	}
};
