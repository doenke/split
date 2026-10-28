import { error, fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { parseAmount, rateFromCharged } from '$lib/core/currency';
import { audit } from '$lib/server/audit';
import { canEditExpense, loadExpenses, requireGroup } from '$lib/server/groups';
import { finalizeIfComplete, markDone, type DoneScope } from '$lib/server/completion';
import type { Actions } from './$types';

async function setDone(params: { id: string }, locals: App.Locals, request: Request, done: boolean) {
	const g = await requireGroup(params.id, locals.user);
	if (g.group.status === 'settled') {
		return fail(400, { message: 'Die Endabrechnung steht bereits. Ein Gruppenadmin kann sie in den Einstellungen wieder öffnen.' });
	}
	const f = await request.formData();
	const kind = String(f.get('scope'));
	let scope: DoneScope;
	if (kind === 'kasse') scope = { type: 'kasse' };
	else if (kind === 'all' || kind === 'person') {
		// admins may report for anybody, e.g. people who never log in
		if (!g.isAdmin) error(403, 'Nur Gruppenadmins dürfen andere abschließen.');
		scope = kind === 'all' ? { type: 'all' } : { type: 'person', personId: String(f.get('personId')) };
	} else scope = { type: 'self' };
	if (done) {
		const drafts = await loadExpenses(params.id, 'draft');
		const mine = drafts.filter((d) => d.createdBy === g.user.id);
		if (mine.length && scope.type !== 'all') {
			return fail(400, { message: `Du hast noch ${mine.length} vorbereitete Ausgabe(n). Bitte erst vervollständigen oder löschen.` });
		}
	}
	await markDone(params.id, g.user, g.membership.kasseId, scope, done);
	await audit(db, {
		groupId: params.id,
		personId: g.user.id,
		action: done ? 'member.done' : 'member.undone',
		entityId: scope.type === 'person' ? scope.personId : undefined,
		data: { scope: scope.type }
	});
	const final = done ? await finalizeIfComplete(params.id, g.user.id) : false;
	return { final };
}

export const actions: Actions = {
	done: ({ params, locals, request }) => setDone(params, locals, request, true),
	undone: ({ params, locals, request }) => setDone(params, locals, request, false),

	/** Enters the amount actually charged in base currency for a foreign-currency expense. */
	charged: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const f = await request.formData();
		const id = String(f.get('id'));
		const [e] = await db
			.select()
			.from(schema.expenses)
			.where(and(eq(schema.expenses.id, id), eq(schema.expenses.groupId, params.id)));
		if (!e || e.deletedAt) error(404);
		if (!canEditExpense(g, g.user.id, e)) error(403);
		if (e.frozenShares) return fail(400, { message: 'Diese Ausgabe gehört zu einer abgeschlossenen Abrechnung.' });
		const charged = parseAmount(String(f.get('charged') ?? ''), g.group.baseCurrency);
		if (!charged || charged <= 0) return fail(400, { message: 'Bitte den abgebuchten Betrag angeben.' });
		await db
			.update(schema.expenses)
			.set({
				baseAmount: charged,
				rate: rateFromCharged(e.amount, e.currency, charged, g.group.baseCurrency),
				rateSource: 'charged',
				rateProvisional: false,
				awaitingCharge: false,
				// the private part keeps its share of the total
				privateAmount: e.baseAmount ? Math.round((e.privateAmount * charged) / e.baseAmount) : 0,
				updatedAt: new Date()
			})
			.where(eq(schema.expenses.id, id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'expense.update', entityId: id, data: { title: e.title, charged } });
		return { chargedSaved: id };
	}
};
