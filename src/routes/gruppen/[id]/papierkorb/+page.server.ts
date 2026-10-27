import { error } from '@sveltejs/kit';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { canEditExpense, requireGroup } from '$lib/server/groups';
import { audit } from '$lib/server/audit';
import { TRASH_DAYS } from '$lib/server/trash';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	await requireGroup(params.id, locals.user);
	const expenses = await db
		.select()
		.from(schema.expenses)
		.where(and(eq(schema.expenses.groupId, params.id), isNotNull(schema.expenses.deletedAt)))
		.orderBy(desc(schema.expenses.deletedAt));
	const settlements = await db
		.select()
		.from(schema.settlements)
		.where(and(eq(schema.settlements.groupId, params.id), isNotNull(schema.settlements.deletedAt)))
		.orderBy(desc(schema.settlements.deletedAt));
	return { trashExpenses: expenses, trashSettlements: settlements, trashDays: TRASH_DAYS };
};

export const actions: Actions = {
	restoreExpense: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const id = String((await request.formData()).get('id'));
		const [e] = await db.select().from(schema.expenses).where(and(eq(schema.expenses.id, id), eq(schema.expenses.groupId, params.id)));
		if (!e) error(404);
		if (!canEditExpense(g, g.user.id, e)) error(403);
		await db.update(schema.expenses).set({ deletedAt: null }).where(eq(schema.expenses.id, id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'expense.restore', entityId: id, data: { title: e.title } });
		return { restored: true };
	},
	restoreSettlement: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const id = String((await request.formData()).get('id'));
		const [s] = await db.select().from(schema.settlements).where(and(eq(schema.settlements.id, id), eq(schema.settlements.groupId, params.id)));
		if (!s) error(404);
		if (![s.fromKasseId, s.toKasseId].includes(g.membership.kasseId) && !g.isAdmin) error(403);
		await db.update(schema.settlements).set({ deletedAt: null }).where(eq(schema.settlements.id, id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'settlement.restore', entityId: id });
		return { restored: true };
	}
};
