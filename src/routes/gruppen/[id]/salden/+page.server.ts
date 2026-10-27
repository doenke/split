import { error, fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { loadMembers, requireGroup } from '$lib/server/groups';
import { newId } from '$lib/server/ids';
import { audit } from '$lib/server/audit';
import { parseAmount } from '$lib/core/currency';
import { today } from '$lib/format';
import type { Actions } from './$types';

const methods = ['cash', 'transfer', 'paypal', 'wero', 'other'] as const;

export const actions: Actions = {
	record: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const f = await request.formData();
		const from = String(f.get('from'));
		const to = String(f.get('to'));
		const amount = parseAmount(String(f.get('amount') ?? ''), g.group.baseCurrency);
		const method = methods.find((m) => m === f.get('method')) ?? 'other';
		if (!amount || amount <= 0) return fail(400, { message: 'Ungültiger Betrag.' });
		const kassen = new Set((await loadMembers(params.id)).map((m) => m.kasseId));
		if (!kassen.has(from) || !kassen.has(to) || from === to) return fail(400, { message: 'Ungültige Zahlung.' });
		const id = newId();
		// the recipient recording a payment confirms it at the same time
		const confirmed = g.membership.kasseId === to;
		await db.insert(schema.settlements).values({
			id,
			groupId: params.id,
			fromKasseId: from,
			toKasseId: to,
			amount,
			method,
			status: confirmed ? 'confirmed' : 'pending',
			confirmedAt: confirmed ? new Date() : null,
			date: today(),
			createdBy: g.user.id
		});
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'settlement.create', entityId: id, data: { from, to, amount } });
		return { ok: true };
	},
	confirm: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const id = String((await request.formData()).get('id'));
		const [s] = await db
			.select()
			.from(schema.settlements)
			.where(and(eq(schema.settlements.id, id), eq(schema.settlements.groupId, params.id)));
		if (!s) error(404);
		if (s.toKasseId !== g.membership.kasseId && !g.isAdmin) error(403, 'Nur der Empfänger kann bestätigen.');
		await db.update(schema.settlements).set({ status: 'confirmed', confirmedAt: new Date() }).where(eq(schema.settlements.id, id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'settlement.confirm', entityId: id });
		return { ok: true };
	},
	delete: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const id = String((await request.formData()).get('id'));
		const [s] = await db
			.select()
			.from(schema.settlements)
			.where(and(eq(schema.settlements.id, id), eq(schema.settlements.groupId, params.id)));
		if (!s) error(404);
		const involved = [s.fromKasseId, s.toKasseId].includes(g.membership.kasseId);
		if (!involved && !g.isAdmin) error(403);
		await db.update(schema.settlements).set({ deletedAt: new Date() }).where(eq(schema.settlements.id, id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'settlement.delete', entityId: id });
		return { ok: true };
	}
};
