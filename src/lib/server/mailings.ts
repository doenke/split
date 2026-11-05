import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import { formatAmount } from '$lib/core/currency';
import { formatIban, paypalLink } from '$lib/core/payment';
import { formatDate, today } from '$lib/format';
import { db, schema } from './db';
import { loadGroupState } from './groups';
import { completionState } from './completion';
import { kasseRecipients, groupRecipients } from './push';
import { mailPeople, sendMail, signToken, smtpConfigured } from './mail';

/** The e-mails Split sends, one function per occasion. All of them respect preferences and quiet groups. */

type Group = { id: string; name: string; emoji: string; baseCurrency: string };
type GroupRef = Pick<Group, 'id' | 'name' | 'emoji'>;

const groupUrl = (id: string, page = '') => `/gruppen/${id}${page}`;

/** How to pay a Kasse: the receiver's payment details as text lines. */
async function payInstructions(kasseId: string, amount: number, currency: string, groupName: string) {
	const [kasse] = await db.select().from(schema.kassen).where(eq(schema.kassen.id, kasseId));
	const receiver = kasse?.receiverPersonId ?? kasse?.personalOf;
	if (!receiver) return [];
	const [d] = await db.select().from(schema.paymentDetails).where(eq(schema.paymentDetails.personId, receiver));
	if (!d) return [];
	const lines: string[] = [];
	if (d.iban && currency === 'EUR') lines.push(`Überweisung: ${d.accountHolder ?? kasse!.name}, IBAN ${formatIban(d.iban)}, Verwendungszweck „Split: ${groupName}“`);
	if (d.paypalMe) lines.push(`PayPal: ${paypalLink(d.paypalMe, amount, currency)}`);
	if (d.weroContact) lines.push(`Wero an: ${d.weroContact}`);
	return lines.length ? ['So kannst du zahlen:\n' + lines.join('\n')] : [];
}

/** New expense: to the others in the group (who have not muted it). */
export async function mailNewExpense(group: GroupRef, author: { id: string; name: string }, row: { title: string; amount: number; currency: string }, expenseId: string) {
	const ids = await groupRecipients(group.id, author.id);
	await mailPeople(
		ids,
		'new_expense',
		(p) => ({
			subject: `${group.emoji} ${group.name}: ${row.title} – ${formatAmount(row.amount, row.currency)}`,
			lines: [`Hallo ${p.name},`, `${author.name} hat in „${group.name}“ eine Ausgabe eingetragen: ${row.title} über ${formatAmount(row.amount, row.currency)}.`],
			action: { label: 'Ausgabe ansehen', url: groupUrl(group.id, `/ausgaben/${expenseId}`) }
		}),
		{ groupId: group.id }
	);
}

/** Someone else added these people to a group. */
export async function mailAddedToGroup(groupId: string, personIds: string[], actor: { id: string; name: string }) {
	const ids = personIds.filter((id) => id !== actor.id);
	if (!ids.length || !smtpConfigured()) return;
	const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, groupId));
	if (!group) return;
	await mailPeople(
		ids,
		'group_added',
		(p) => ({
			subject: `${group.emoji} Du bist jetzt in der Gruppe „${group.name}“`,
			lines: [`Hallo ${p.name},`, `${actor.name} hat dich zur Gruppe „${group.name}“ in Split hinzugefügt. Dort werden die gemeinsamen Kosten aufgeteilt.`],
			action: { label: 'Gruppe öffnen', url: groupUrl(groupId) }
		}),
		{ groupId }
	);
}

/** The final statement stands: a summary for everyone, and a payment request for those who have to pay. */
export async function mailFinalStatement(groupId: string) {
	if (!smtpConfigured()) return;
	const state = await loadGroupState(groupId);
	const group = state.group;
	const cur = group.baseCurrency;
	const names = new Map(state.kassen.map((k) => [k.id, k.name]));
	for (const kasseId of new Set(state.members.map((m) => m.kasseId))) {
		const ids = await kasseRecipients(groupId, kasseId, null);
		const out = state.transfers.filter((t) => t.from === kasseId);
		const inc = state.transfers.filter((t) => t.to === kasseId);
		const balance = state.balances.kassen.get(kasseId);
		const summary = [
			`Bezahlt: ${formatAmount(balance?.paid ?? 0, cur)}, Anteil: ${formatAmount(balance?.consumed ?? 0, cur)}.`,
			out.length
				? out.map((t) => `Du zahlst ${formatAmount(t.amount, cur)} an ${names.get(t.to)}.`).join('\n')
				: inc.length
					? inc.map((t) => `Du bekommst ${formatAmount(t.amount, cur)} von ${names.get(t.from)}.`).join('\n')
					: 'Bei euch ist alles ausgeglichen.'
		];
		await mailPeople(
			ids,
			'final_statement',
			(p) => ({
				subject: `${group.emoji} ${group.name}: Die Endabrechnung steht`,
				lines: [`Hallo ${p.name},`, `alle haben ihre Ausgaben eingetragen – die Endabrechnung von „${group.name}“ steht.`, ...summary],
				action: { label: 'Abrechnung ansehen', url: groupUrl(groupId, '/salden') }
			}),
			{ groupId }
		);
		for (const t of out) {
			const how = await payInstructions(t.to, t.amount, cur, group.name);
			await mailPeople(
				ids,
				'payment_request',
				(p) => ({
					subject: `${group.emoji} ${group.name}: Bitte ${formatAmount(t.amount, cur)} an ${names.get(t.to)} zahlen`,
					lines: [
						`Hallo ${p.name},`,
						`die Endabrechnung von „${group.name}“ steht. Bitte zahle ${formatAmount(t.amount, cur)} an ${names.get(t.to)}.`,
						...how,
						'Trag die Zahlung danach in Split ein („Bezahlt“), damit alle Bescheid wissen.'
					],
					action: { label: 'Jetzt bezahlen', url: groupUrl(groupId, '/salden') }
				}),
				{ groupId, ref: `${groupId}:${t.to}` }
			);
		}
	}
}

/** The receiver reminds the payer of an open transfer. */
export async function mailPaymentReminder(group: Group, from: string, to: string, amount: number, sender: { id: string; name: string }) {
	const ids = await kasseRecipients(group.id, from, sender.id);
	const [kasse] = await db.select({ name: schema.kassen.name }).from(schema.kassen).where(eq(schema.kassen.id, to));
	const how = await payInstructions(to, amount, group.baseCurrency, group.name);
	await mailPeople(
		ids,
		'payment_reminder',
		(p) => ({
			subject: `${group.emoji} ${group.name}: Erinnerung an ${formatAmount(amount, group.baseCurrency)}`,
			lines: [
				`Hallo ${p.name},`,
				`${sender.name} erinnert dich freundlich an die offene Zahlung von ${formatAmount(amount, group.baseCurrency)} an ${kasse?.name ?? sender.name} aus „${group.name}“.`,
				...how
			],
			action: { label: 'Jetzt bezahlen', url: groupUrl(group.id, '/salden') }
		}),
		{ groupId: group.id }
	);
}

/** A payment to the recipient was recorded by someone else (in groups with confirmations: please confirm it). */
export async function mailPaymentReceived(group: Group, to: string, amount: number, author: { id: string; name: string }, confirm: boolean) {
	const ids = await kasseRecipients(group.id, to, author.id);
	await mailPeople(
		ids,
		'payment_to_confirm',
		(p) => ({
			subject: `${group.emoji} ${group.name}: ${author.name} hat dir ${formatAmount(amount, group.baseCurrency)} gezahlt`,
			lines: [
				`Hallo ${p.name},`,
				`${author.name} hat in „${group.name}“ eine Zahlung über ${formatAmount(amount, group.baseCurrency)} an dich eingetragen.` +
					(confirm ? ' Bitte bestätige den Eingang, sobald das Geld da ist.' : '')
			],
			action: { label: confirm ? 'Eingang bestätigen' : 'Zahlungen ansehen', url: groupUrl(group.id, '/salden') }
		}),
		{ groupId: group.id }
	);
}

/** The personal access link, sent by the person who created it. */
export async function sendInviteMail(to: string, invited: string, inviter: string, group: { name: string } | null, url: string) {
	return sendMail(to, {
		subject: group ? `${inviter} lädt dich zu „${group.name}“ in Split ein` : `${inviter} lädt dich zu Split ein`,
		lines: [
			`Hallo ${invited},`,
			group
				? `${inviter} teilt die Kosten von „${group.name}“ mit Split und hat dich eingeladen.`
				: `${inviter} hat dich zu Split eingeladen, um gemeinsame Kosten zu teilen.`,
			'Du brauchst kein Konto und kein Passwort: Der Link unten ist dein persönlicher Zugang. Er funktioniert immer wieder – speichere ihn am besten als Lesezeichen und gib ihn nicht weiter.'
		],
		action: { label: 'Split öffnen', url }
	});
}

/**
 * Regular reminders (run every hour; each one goes out at most weekly):
 * - groups whose end date is past: please enter your expenses and report "done" (at most 3 times)
 * - final statements: payments you still have to make (from a week after the statement, at most 6 times)
 */
export async function runMailJobs() {
	if (!smtpConfigured()) return;

	const ended = await db
		.select()
		.from(schema.groups)
		.where(and(eq(schema.groups.status, 'active'), isNull(schema.groups.archivedAt), isNull(schema.groups.deletedAt), lt(schema.groups.endDate, today())));
	for (const group of ended) {
		const state = await loadGroupState(group.id);
		const c = await completionState(state.members, group);
		const open = c.required.filter((id) => !c.done.includes(id));
		await mailPeople(
			open,
			'completion_reminder',
			async (p) => ({
				subject: `${group.emoji} ${group.name}: Hast du alles eingetragen?`,
				lines: [
					`Hallo ${p.name},`,
					`„${group.name}“ ist am ${formatDate(group.endDate!)} zu Ende gegangen. Fehlen noch Ausgaben von dir? Dann trag sie bitte ein.`,
					'Hast du schon alles eingetragen oder hattest keine Ausgaben, schließe einfach direkt hier ab. Sobald alle fertig sind, steht die Endabrechnung.'
				],
				action: { label: 'Ich bin fertig – abschließen', url: `/mail/fertig?t=${encodeURIComponent(await signToken(['done', p.id, group.id]))}` },
				secondary: { label: 'Ausgaben eintragen', url: groupUrl(group.id) }
			}),
			{ groupId: group.id, everyDays: 7, maxTimes: 3 }
		);
	}

	const settled = await db
		.select()
		.from(schema.groups)
		.where(and(eq(schema.groups.status, 'settled'), isNull(schema.groups.archivedAt), isNull(schema.groups.deletedAt)));
	for (const group of settled) {
		// the payment request went out with the statement; weekly reminders start a week later
		const [final] = await db
			.select({ at: schema.auditLog.createdAt })
			.from(schema.auditLog)
			.where(and(eq(schema.auditLog.groupId, group.id), eq(schema.auditLog.action, 'group.final')))
			.orderBy(desc(schema.auditLog.createdAt))
			.limit(1);
		if (!final || final.at > new Date(Date.now() - 7 * 86_400_000)) continue;
		const state = await loadGroupState(group.id);
		const cur = group.baseCurrency;
		const names = new Map(state.kassen.map((k) => [k.id, k.name]));
		const debtors = new Set(state.transfers.map((t) => t.from));
		for (const kasseId of debtors) {
			const out = state.transfers.filter((t) => t.from === kasseId);
			const ids = await kasseRecipients(group.id, kasseId, null);
			await mailPeople(
				ids,
				'open_payments',
				(p) => ({
					subject: `${group.emoji} ${group.name}: Noch offene Zahlungen`,
					lines: [
						`Hallo ${p.name},`,
						`aus der Endabrechnung von „${group.name}“ ist noch offen:\n${out.map((t) => `${formatAmount(t.amount, cur)} an ${names.get(t.to)}`).join('\n')}`,
						'Schon bezahlt? Dann trag die Zahlung in Split ein, dann hören diese Erinnerungen auf.'
					],
					action: { label: 'Jetzt bezahlen', url: groupUrl(group.id, '/salden') }
				}),
				{ groupId: group.id, everyDays: 7, maxTimes: 6 }
			);
		}
	}
}
