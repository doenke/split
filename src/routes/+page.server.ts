import { redirect } from '@sveltejs/kit';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { audit } from '$lib/server/audit';
import { db, schema } from '$lib/server/db';
import { loadGroupState } from '$lib/server/groups';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const me = locals.user.id;
	const rows = await db
		.select({ group: schema.groups, kasseId: schema.memberships.kasseId })
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.where(and(eq(schema.memberships.personId, me), isNull(schema.groups.deletedAt)));

	const groups = await Promise.all(
		rows.map(async ({ group, kasseId }) => {
			const state = await loadGroupState(group.id);
			const kasse = state.balances.kassen.get(kasseId);
			return {
				id: group.id,
				name: group.name,
				emoji: group.emoji,
				status: group.status,
				currency: group.baseCurrency,
				startDate: group.startDate,
				memberCount: state.members.length,
				myBalance: kasse?.balance ?? 0,
				lastActivity: state.expenses[0]?.date ?? group.createdAt.toISOString().slice(0, 10)
			};
		})
	);
	const deleted = await db
		.select({ id: schema.groups.id, name: schema.groups.name, emoji: schema.groups.emoji, deletedAt: schema.groups.deletedAt })
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.where(and(eq(schema.memberships.personId, me), eq(schema.memberships.role, 'admin'), isNotNull(schema.groups.deletedAt)));
	groups.sort((a, b) => (a.status === 'archived' ? 1 : 0) - (b.status === 'archived' ? 1 : 0) || b.lastActivity.localeCompare(a.lastActivity));
	return { groups, deleted };
};

export const actions: Actions = {
	restoreGroup: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const id = String((await request.formData()).get('id'));
		const [m] = await db
			.select()
			.from(schema.memberships)
			.where(and(eq(schema.memberships.groupId, id), eq(schema.memberships.personId, locals.user.id), eq(schema.memberships.role, 'admin')));
		if (!m) error(403);
		await db.update(schema.groups).set({ deletedAt: null }).where(eq(schema.groups.id, id));
		await audit(db, { groupId: id, personId: locals.user.id, action: 'group.restore', entityId: id });
		redirect(303, `/gruppen/${id}`);
	}
};
