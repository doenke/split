import { db, schema } from './db';
import { audit } from './audit';
import { newId } from './ids';
import { loadMembers } from './groups';
import { kasseRecipients, notify } from './push';
import { formatAmount } from '$lib/core/currency';
import { today } from '$lib/format';
import type { SessionUser } from './auth/session';

export const paymentMethods = ['cash', 'transfer', 'paypal', 'wero', 'other'] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export class SettlementError extends Error {}

/**
 * Records a payment from one Kasse of the group to another. The recipient recording it confirms it at the
 * same time; otherwise the recipient is asked to confirm.
 */
export async function recordSettlement(
	g: { group: { id: string; name: string; emoji: string; baseCurrency: string }; membership: { kasseId: string }; user: SessionUser },
	p: { from: string; to: string; amount: number; method: PaymentMethod; date?: string }
) {
	const groupId = g.group.id;
	if (!Number.isInteger(p.amount) || p.amount <= 0) throw new SettlementError('Ungültiger Betrag.');
	const kassen = new Set((await loadMembers(groupId)).map((m) => m.kasseId));
	if (!kassen.has(p.from) || !kassen.has(p.to) || p.from === p.to) throw new SettlementError('Ungültige Zahlung.');
	const id = newId();
	const confirmed = g.membership.kasseId === p.to;
	await db.insert(schema.settlements).values({
		id,
		groupId,
		fromKasseId: p.from,
		toKasseId: p.to,
		amount: p.amount,
		method: p.method,
		status: confirmed ? 'confirmed' : 'pending',
		confirmedAt: confirmed ? new Date() : null,
		date: p.date || today(),
		createdBy: g.user.id
	});
	await audit(db, { groupId, personId: g.user.id, action: 'settlement.create', entityId: id, data: { from: p.from, to: p.to, amount: p.amount } });
	const money = formatAmount(p.amount, g.group.baseCurrency);
	const url = `/gruppen/${groupId}/salden`;
	const title = `${g.group.emoji} ${g.group.name}`;
	if (confirmed) {
		void kasseRecipients(groupId, p.from, g.user.id).then((ids) => notify(ids, { title, body: `${g.user.name} hat ${money} von dir erhalten. Danke!`, url }));
	} else {
		void kasseRecipients(groupId, p.to, g.user.id).then((ids) =>
			notify(ids, { title, body: `${g.user.name} hat dir ${money} gezahlt – bitte den Eingang bestätigen.`, url })
		);
	}
	return { id, confirmed };
}
