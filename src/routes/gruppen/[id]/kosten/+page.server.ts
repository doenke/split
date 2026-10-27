import { groupCosts } from '$lib/server/costs';
import { requireGroup } from '$lib/server/groups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	await requireGroup(params.id, locals.user);
	const { persons, kassen } = await groupCosts(params.id);
	return { costs: { persons, kassen } };
};
