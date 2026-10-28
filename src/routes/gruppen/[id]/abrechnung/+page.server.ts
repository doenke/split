import { computeShares } from '$lib/core/split';
import { groupCosts } from '$lib/server/costs';
import { loadGroupState, requireGroup } from '$lib/server/groups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	await requireGroup(params.id, locals.user);
	const state = await loadGroupState(params.id);
	const costs = await groupCosts(params.id, state);
	// share of every person in every expense (base currency, income negative)
	const shares: Record<string, Record<string, number>> = {};
	state.expenses.forEach((e, i) => {
		try {
			shares[e.id] = Object.fromEntries(computeShares(state.coreExpenses[i], state.coreMembers));
		} catch {
			shares[e.id] = {};
		}
	});
	return { costs: { kassen: costs.kassen }, shares, generatedAt: new Date().toISOString() };
};
