import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireGroup, loadMembers, loadProfiles } from '$lib/server/groups';
import { InputError, prepareExpense, saveExpense } from '$lib/server/expenses';
import { currencyOptions } from '$lib/server/currencies';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const data = await parent();
	const used = [...new Set(data.expenses.map((e) => e.currency))];
	// receipt uploaded via /teilen
	const beleg = url.searchParams.get('beleg');
	const shared = beleg
		? await db
				.select({ id: schema.attachments.id, mime: schema.attachments.mime })
				.from(schema.attachments)
				.where(
					and(
						eq(schema.attachments.id, beleg),
						eq(schema.attachments.groupId, data.group.id),
						eq(schema.attachments.uploadedBy, data.user!.id),
						isNull(schema.attachments.expenseId)
					)
				)
		: [];
	return { currencies: await currencyOptions(data.group.baseCurrency, used), lastCurrency: data.expenses[0]?.currency, shared };
};

export const actions: Actions = {
	save: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const [members, profiles] = await Promise.all([loadMembers(params.id), loadProfiles(params.id)]);
		let prepared;
		try {
			prepared = await prepareExpense(JSON.parse(String((await request.formData()).get('payload'))), g.group, members, profiles);
		} catch (e) {
			if (e instanceof InputError || e instanceof SyntaxError) return fail(400, { message: e.message });
			throw e;
		}
		await saveExpense(params.id, g.user.id, prepared);
		redirect(303, `/gruppen/${params.id}`);
	}
};
