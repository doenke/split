import { groupCosts } from '$lib/server/costs';
import { loadGroupState, requireGroup } from '$lib/server/groups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	await requireGroup(params.id, locals.user);
	const state = await loadGroupState(params.id);
	const costs = await groupCosts(params.id, state);
	return { costs: { kassen: costs.kassen }, generatedAt: new Date().toISOString() };
};
