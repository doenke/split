import { fail, redirect } from '@sveltejs/kit';
import { requireGroup, loadMembers } from '$lib/server/groups';
import { InputError, prepareExpense, saveExpense } from '$lib/server/expenses';
import { currencyOptions } from '$lib/server/currencies';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();
	const used = [...new Set(data.expenses.map((e) => e.currency))];
	return { currencies: await currencyOptions(data.group.baseCurrency, used), lastCurrency: data.expenses[0]?.currency };
};

export const actions: Actions = {
	save: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const members = await loadMembers(params.id);
		let prepared;
		try {
			prepared = await prepareExpense(JSON.parse(String((await request.formData()).get('payload'))), g.group, members);
		} catch (e) {
			if (e instanceof InputError || e instanceof SyntaxError) return fail(400, { message: e.message });
			throw e;
		}
		await saveExpense(params.id, g.user.id, prepared);
		redirect(303, `/gruppen/${params.id}`);
	}
};
