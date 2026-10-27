import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { canEditExpense, loadMembers, loadProfiles, requireGroup, toCoreExpense, toCoreMember } from '$lib/server/groups';
import { InputError, prepareExpense, saveExpense } from '$lib/server/expenses';
import { currencyOptions } from '$lib/server/currencies';
import { isClosed } from '$lib/server/closing';
import { audit } from '$lib/server/audit';
import { computeShares } from '$lib/core/split';
import type { ExpenseInput } from '$lib/expense-input';
import type { Actions, PageServerLoad } from './$types';

async function requireExpense(groupId: string, expenseId: string) {
	const [e] = await db
		.select()
		.from(schema.expenses)
		.where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)));
	if (!e || e.deletedAt) error(404, 'Ausgabe nicht gefunden.');
	return e;
}

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const data = await parent();
	const expense = data.expenses.find((e) => e.id === params.eid);
	if (!expense) error(404, 'Ausgabe nicht gefunden.');
	const g = await requireGroup(params.id, locals.user);

	const privateOriginal =
		expense.baseAmount === 0 ? 0 : Math.round((expense.privateAmount * expense.amount) / expense.baseAmount);
	const initial: ExpenseInput = {
		type: expense.type,
		title: expense.title,
		amount: expense.amount,
		currency: expense.currency,
		date: expense.date,
		payers: expense.payers.map((p) => ({ personId: p.personId, amount: p.amount })),
		categoryId: expense.categoryId,
		// an explicit rule overrides the profile
		profileId: expense.rule ? null : expense.profileId,
		rule: expense.rule ?? { type: 'all' },
		privateAmount: privateOriginal,
		rate: {
			source: expense.rateSource === 'manual' ? 'manual' : expense.rateSource === 'charged' ? 'charged' : 'auto',
			value: expense.rateSource === 'manual' ? expense.rate : undefined,
			charged: expense.rateSource === 'charged' ? expense.baseAmount : undefined
		},
		period:
			expense.periodFrom && expense.periodTo && expense.periodUnit
				? { from: expense.periodFrom, to: expense.periodTo, unit: expense.periodUnit }
				: null,
		notes: expense.notes ?? ''
	};

	// current shares in base currency, for the detail view
	let shares: Record<string, number> = {};
	try {
		shares = Object.fromEntries(computeShares(toCoreExpense(expense, data.profiles), data.members.map(toCoreMember)));
	} catch {
		// shown as error in the layout
	}
	const history = await db
		.select({ action: schema.auditLog.action, personId: schema.auditLog.personId, createdAt: schema.auditLog.createdAt })
		.from(schema.auditLog)
		.where(eq(schema.auditLog.entityId, expense.id))
		.orderBy(schema.auditLog.createdAt);
	const used = [...new Set(data.expenses.map((e) => e.currency))];
	return {
		expense,
		initial,
		shares,
		history,
		canEdit: canEditExpense(g, g.user.id, expense) && !expense.frozenShares,
		frozen: Boolean(expense.frozenShares),
		currencies: await currencyOptions(data.group.baseCurrency, used)
	};
};

export const actions: Actions = {
	save: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const existing = await requireExpense(params.id, params.eid);
		if (!canEditExpense(g, g.user.id, existing)) error(403, 'Du darfst diese Ausgabe nicht bearbeiten.');
		if (existing.frozenShares) return fail(400, { message: 'Diese Ausgabe gehört zu einer abgeschlossenen Abrechnung.' });
		const [members, profiles] = await Promise.all([loadMembers(params.id), loadProfiles(params.id)]);
		let prepared;
		try {
			prepared = await prepareExpense(
				JSON.parse(String((await request.formData()).get('payload'))),
				g.group,
				members,
				profiles,
				existing
			);
		} catch (e) {
			if (e instanceof InputError || e instanceof SyntaxError) return fail(400, { message: e.message });
			throw e;
		}
		if (isClosed(g.group, prepared.row.date)) {
			return fail(400, { message: `Die Abrechnung ist bis ${g.group.closedUntil} abgeschlossen. Wähle ein späteres Datum.` });
		}
		await saveExpense(params.id, g.user.id, prepared, params.eid);
		redirect(303, `/gruppen/${params.id}/ausgaben/${params.eid}`);
	},
	delete: async ({ params, locals }) => {
		const g = await requireGroup(params.id, locals.user);
		const existing = await requireExpense(params.id, params.eid);
		if (!canEditExpense(g, g.user.id, existing)) error(403, 'Du darfst diese Ausgabe nicht löschen.');
		if (existing.frozenShares) return fail(400, { message: 'Diese Ausgabe gehört zu einer abgeschlossenen Abrechnung.' });
		await db.update(schema.expenses).set({ deletedAt: new Date() }).where(eq(schema.expenses.id, params.eid));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'expense.delete', entityId: params.eid, data: { title: existing.title } });
		redirect(303, `/gruppen/${params.id}`);
	}
};
