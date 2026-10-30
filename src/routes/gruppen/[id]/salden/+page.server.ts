import { error, fail } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db, schema } from '$lib/server/db';
import { loadGroupState, loadMembers, requireGroup } from '$lib/server/groups';
import { audit } from '$lib/server/audit';
import { parseAmount } from '$lib/core/currency';
import { epcPayload, formatIban, paypalLink } from '$lib/core/payment';
import { formatAmount } from '$lib/core/currency';
import { kasseRecipients, notify } from '$lib/server/push';
import { paymentMethods, recordSettlement, SettlementError } from '$lib/server/settlements';
import { gt } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

const REMINDER_HOURS = 24;

/** Payment options for the transfers the current user has to make. */
export const load: PageServerLoad = async ({ params, locals }) => {
	const g = await requireGroup(params.id, locals.user);
	const state = await loadGroupState(params.id);
	const mine = state.transfers.filter((t) => t.from === g.membership.kasseId);
	const kassen = new Map(state.kassen.map((k) => [k.id, k]));
	const receivers = [...new Set(mine.map((t) => kassen.get(t.to)?.receiverPersonId ?? kassen.get(t.to)?.personalOf).filter((x): x is string => !!x))];
	const details = receivers.length
		? await db.select().from(schema.paymentDetails).where(inArray(schema.paymentDetails.personId, receivers))
		: [];
	const names = new Map(
		(receivers.length ? await db.select({ id: schema.persons.id, name: schema.persons.name }).from(schema.persons).where(inArray(schema.persons.id, receivers)) : []).map((p) => [p.id, p.name])
	);
	const currency = g.group.baseCurrency;
	const text = `Split: ${g.group.name}`;
	const options: Record<string, unknown> = {};
	for (const t of mine) {
		const k = kassen.get(t.to);
		const receiverId = k?.receiverPersonId ?? k?.personalOf;
		const d = details.find((x) => x.personId === receiverId);
		if (!d || !receiverId) continue;
		const holder = d.accountHolder ?? names.get(receiverId) ?? '';
		options[t.from + '|' + t.to] = {
			receiverName: names.get(receiverId),
			paypal: d.paypalMe ? paypalLink(d.paypalMe, t.amount, currency) : null,
			iban: d.iban ? formatIban(d.iban) : null,
			holder,
			girocode:
				d.iban && currency === 'EUR'
					? await QRCode.toString(epcPayload({ name: holder, iban: d.iban, amount: t.amount, text }), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
					: null,
			weroContact: d.weroContact,
			text
		};
	}
	return { paymentOptions: options };
};


export const actions: Actions = {
	record: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const f = await request.formData();
		const amount = parseAmount(String(f.get('amount') ?? ''), g.group.baseCurrency);
		if (!amount || amount <= 0) return fail(400, { message: 'Ungültiger Betrag.' });
		const dateIn = String(f.get('date') ?? '');
		// one day of slack: the browser's "today" may already be tomorrow on the server's clock
		const latest = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
		if (dateIn && (!/^\d{4}-\d{2}-\d{2}$/.test(dateIn) || dateIn > latest)) return fail(400, { message: 'Ungültiges Datum.' });
		try {
			await recordSettlement(g, {
				from: String(f.get('from')),
				to: String(f.get('to')),
				amount,
				method: paymentMethods.find((m) => m === f.get('method')) ?? 'other',
				date: dateIn || undefined
			});
		} catch (e) {
			if (e instanceof SettlementError) return fail(400, { message: e.message });
			throw e;
		}
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
		void kasseRecipients(params.id, s.fromKasseId, g.user.id).then((ids) =>
			notify(ids, {
				title: `${g.group.emoji} ${g.group.name}`,
				body: `${g.user.name} hat deine Zahlung über ${formatAmount(s.amount, g.group.baseCurrency)} bestätigt.`,
				url: `/gruppen/${params.id}/salden`
			})
		);
		return { ok: true };
	},
	/** The receiver reminds the payer of an open transfer (at most once a day). */
	remind: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const from = String((await request.formData()).get('from'));
		const state = await loadGroupState(params.id);
		const t = state.transfers.find((x) => x.from === from && x.to === g.membership.kasseId);
		if (!t) return fail(400, { message: 'Diese Zahlung ist nicht mehr offen.' });
		const key = `${from}|${t.to}`;
		const [recent] = await db
			.select({ id: schema.auditLog.id })
			.from(schema.auditLog)
			.where(
				and(
					eq(schema.auditLog.groupId, params.id),
					eq(schema.auditLog.action, 'settlement.remind'),
					eq(schema.auditLog.entityId, key),
					gt(schema.auditLog.createdAt, new Date(Date.now() - REMINDER_HOURS * 3_600_000))
				)
			)
			.limit(1);
		if (recent) return fail(400, { message: 'Es wurde heute schon erinnert.' });
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'settlement.remind', entityId: key });
		const ids = await kasseRecipients(params.id, from, g.user.id);
		await notify(ids, {
			title: `${g.group.emoji} ${g.group.name}`,
			body: `Erinnerung von ${g.user.name}: noch ${formatAmount(t.amount, g.group.baseCurrency)} offen.`,
			url: `/gruppen/${params.id}/salden`,
			tag: `remind-${key}`
		});
		return { reminded: from };
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
