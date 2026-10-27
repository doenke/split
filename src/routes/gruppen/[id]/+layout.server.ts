import { loadCategories, loadGroupState, requireGroup } from '$lib/server/groups';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, depends }) => {
	depends('app:group');
	const g = await requireGroup(params.id, locals.user);
	const [state, categories] = await Promise.all([loadGroupState(params.id), loadCategories(params.id)]);
	const kassen = Object.fromEntries(state.kassen.map((k) => [k.id, { id: k.id, name: k.name, personalOf: k.personalOf }]));
	const balances = {
		persons: Object.fromEntries(state.balances.persons),
		kassen: Object.fromEntries(state.balances.kassen),
		errors: state.balances.errors
	};
	return {
		group: state.group,
		isAdmin: g.isAdmin,
		myKasseId: g.membership.kasseId,
		members: state.members,
		expenses: state.expenses,
		settlements: state.settlements,
		profiles: state.profiles,
		categories,
		kassen,
		balances,
		transfers: state.transfers
	};
};
