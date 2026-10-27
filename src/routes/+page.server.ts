import { redirect } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { loadGroupState } from '$lib/server/groups';
import type { PageServerLoad } from './$types';

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
	groups.sort((a, b) => (a.status === 'archived' ? 1 : 0) - (b.status === 'archived' ? 1 : 0) || b.lastActivity.localeCompare(a.lastActivity));
	return { groups };
};
