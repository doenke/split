import { and, eq, inArray, isNull } from 'drizzle-orm';
import { computeShares, SplitError } from '$lib/core/split';
import { convert, rateFromCharged } from '$lib/core/currency';
import type { ExpenseInput } from '$lib/expense-input';
import type { SplitRule } from '$lib/core/types';
import { db, schema } from './db';
import { audit } from './audit';
import { newId } from './ids';
import { lookupRate } from './rates';
import { toCoreExpense, toCoreMember, type GroupMember } from './groups';

export class InputError extends Error {}

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

/** Validates the form input and computes everything that is stored. */
export async function prepareExpense(
	raw: unknown,
	group: { id: string; baseCurrency: string },
	members: GroupMember[],
	profiles: { id: string; rule: SplitRule }[],
	/** when editing: keeps the stored ECB rate if currency and date did not change */
	existing?: { currency: string; date: string; rate: number; rateSource: string; rateProvisional: boolean }
) {
	const input = raw as ExpenseInput;
	if (!input || typeof input !== 'object') throw new InputError('Ungültige Eingabe.');
	const title = String(input.title ?? '').trim();
	if (!title) throw new InputError('Bitte gib einen Titel an.');
	if (!isInt(input.amount) || input.amount <= 0) throw new InputError('Bitte gib einen Betrag an.');
	if (!/^[A-Z]{3}$/.test(input.currency)) throw new InputError('Ungültige Währung.');
	if (!isDate(input.date)) throw new InputError('Ungültiges Datum.');
	const memberIds = new Set(members.map((m) => m.personId));

	const payers = (input.payers ?? []).filter((p) => p.amount > 0);
	if (!payers.length) throw new InputError('Wer hat bezahlt?');
	for (const p of payers) {
		if (!memberIds.has(p.personId) || !isInt(p.amount)) throw new InputError('Ungültige Zahler.');
	}
	if (payers.length > 1 && payers.reduce((s, p) => s + p.amount, 0) !== input.amount) {
		throw new InputError('Die Beträge der Zahler ergeben nicht den Gesamtbetrag.');
	}
	if (payers.length === 1) payers[0].amount = input.amount;

	const privateAmount = isInt(input.privateAmount) ? input.privateAmount : 0;
	if (privateAmount < 0 || privateAmount >= input.amount) throw new InputError('Der private Anteil muss kleiner als der Betrag sein.');

	// exchange rate
	let rate = 1;
	let rateSource: 'none' | 'ecb' | 'manual' | 'charged' = 'none';
	let rateProvisional = false;
	if (input.currency !== group.baseCurrency) {
		if (input.rate?.source === 'manual' && typeof input.rate.value === 'number' && input.rate.value > 0) {
			rate = input.rate.value;
			rateSource = 'manual';
		} else if (input.rate?.source === 'charged' && isInt(input.rate.charged) && input.rate.charged > 0) {
			rate = rateFromCharged(input.amount, input.currency, input.rate.charged, group.baseCurrency);
			rateSource = 'charged';
		} else if (existing?.rateSource === 'ecb' && existing.currency === input.currency && existing.date === input.date) {
			rate = existing.rate;
			rateSource = 'ecb';
			rateProvisional = existing.rateProvisional;
		} else {
			const found = await lookupRate(input.currency, group.baseCurrency, input.date);
			if (!found) throw new InputError(`Für ${input.currency} ist kein Kurs bekannt. Bitte gib den Kurs oder den abgebuchten Betrag an.`);
			rate = found.rate;
			rateSource = 'ecb';
			rateProvisional = found.provisional;
		}
	}
	const baseAmount =
		rateSource === 'charged' ? input.rate.charged! : convert(input.amount, input.currency, group.baseCurrency, rate);
	const privateBase = Math.round((privateAmount * baseAmount) / input.amount);

	// rule: with a profile the expense follows the profile (stored rule = null)
	const profile = input.profileId ? profiles.find((p) => p.id === input.profileId) : undefined;
	if (input.profileId && !profile) throw new InputError('Unbekanntes Profil.');
	const equal = input.equalWeights === true;
	let rule: SplitRule = profile ? profile.rule : input.rule;
	if (rule && equal && rule.type !== 'individual') rule = { ...rule, equalWeights: true };
	if (!rule || !['all', 'all_except', 'only', 'individual'].includes(rule.type)) throw new InputError('Ungültige Aufteilung.');
	const ids = rule.type === 'all_except' ? rule.excluded : rule.type === 'only' ? rule.included : rule.type === 'individual' ? Object.keys(rule.values) : [];
	if (ids.some((id) => !memberIds.has(id))) throw new InputError('Unbekannte Person in der Aufteilung.');
	if (rule.type === 'individual') {
		const values = Object.values(rule.values);
		if (values.some((v) => typeof v !== 'number' || v < 0)) throw new InputError('Ungültige Anteile.');
		if (rule.mode === 'amounts' && values.reduce((s, v) => s + v, 0) !== input.amount - privateAmount) {
			throw new InputError('Die Einzelbeträge ergeben nicht den (gemeinsamen) Betrag.');
		}
		if (rule.mode === 'percent' && Math.abs(values.reduce((s, v) => s + v, 0) - 100) > 0.01) {
			throw new InputError('Die Prozente ergeben nicht 100 %.');
		}
	}

	let period = null;
	if (input.period) {
		if (!isDate(input.period.from) || !isDate(input.period.to) || input.period.to < input.period.from) {
			throw new InputError('Ungültiger Zeitraum.');
		}
		if (input.period.unit === 'nights' && input.period.to === input.period.from) {
			throw new InputError('Für Übernachtungen muss das Ende nach dem Beginn liegen.');
		}
		period = input.period;
	}

	const row = {
		type: input.type === 'income' ? ('income' as const) : ('expense' as const),
		title,
		date: input.date,
		amount: input.amount,
		currency: input.currency,
		rate,
		rateSource,
		rateProvisional,
		baseAmount,
		privateAmount: privateBase,
		categoryId: input.categoryId || null,
		profileId: profile?.id ?? null,
		// a profile used as is stays linked (and follows later profile changes)
		rule: profile && !equal ? null : rule,
		periodFrom: period?.from ?? null,
		periodTo: period?.to ?? null,
		periodUnit: period?.unit ?? null,
		notes: String(input.notes ?? '').trim() || null,
		// until the charged amount is entered, the ECB rate is used
		awaitingCharge: rateSource === 'ecb' && input.awaitingCharge === true
	};

	// make sure it can be split at all
	try {
		computeShares(
			toCoreExpense({ ...row, id: 'new', payers: payers.map((p) => ({ ...p, expenseId: 'new' })) } as never, profiles),
			members.map(toCoreMember)
		);
	} catch (e) {
		if (e instanceof SplitError) throw new InputError(e.message);
		throw e;
	}
	const attachmentIds = Array.isArray(input.attachmentIds) ? input.attachmentIds.filter((x) => typeof x === 'string').slice(0, 20) : [];
	const clientId = typeof input.clientId === 'string' && /^[\w-]{8,64}$/.test(input.clientId) ? input.clientId : null;
	const sel = input.receiptSelection;
	const receiptSelection =
		sel && typeof sel.attachmentId === 'string' && Array.isArray(sel.deselected)
			? { attachmentId: sel.attachmentId, deselected: sel.deselected.filter((n) => Number.isInteger(n)).slice(0, 500) }
			: null;
	return { row, payers, attachmentIds, clientId, receiptSelection };
}

export async function saveExpense(
	groupId: string,
	userId: string,
	prepared: Awaited<ReturnType<typeof prepareExpense>>,
	existingId?: string
) {
	if (!existingId && prepared.clientId) {
		// already saved (offline sync retried, or the form was submitted twice)
		const [dup] = await db
			.select({ id: schema.expenses.id })
			.from(schema.expenses)
			.where(and(eq(schema.expenses.clientId, prepared.clientId), eq(schema.expenses.groupId, groupId)));
		if (dup) return dup.id;
	}
	const id = existingId ?? newId();
	await db.transaction(async (tx) => {
		if (existingId) {
			await tx
				.update(schema.expenses)
				// saving a prepared expense completes it
				.set({ ...prepared.row, status: 'final', updatedAt: new Date() })
				.where(eq(schema.expenses.id, existingId));
			await tx.delete(schema.expensePayers).where(eq(schema.expensePayers.expenseId, existingId));
		} else {
			await tx.insert(schema.expenses).values({ ...prepared.row, id, groupId, createdBy: userId, clientId: prepared.clientId });
		}
		await tx.insert(schema.expensePayers).values(prepared.payers.map((p) => ({ ...p, expenseId: id })));
		if (prepared.attachmentIds.length) {
			await tx
				.update(schema.attachments)
				.set({ expenseId: id })
				.where(
					and(
						inArray(schema.attachments.id, prepared.attachmentIds),
						eq(schema.attachments.groupId, groupId),
						isNull(schema.attachments.expenseId)
					)
				);
		}
		// remember which receipt items were taken out, so the selection can be changed later
		if (prepared.receiptSelection) {
			const [a] = await tx
				.select()
				.from(schema.attachments)
				.where(and(eq(schema.attachments.id, prepared.receiptSelection.attachmentId), eq(schema.attachments.groupId, groupId)));
			if (a?.ocrResult) {
				await tx
					.update(schema.attachments)
					.set({ ocrResult: { ...a.ocrResult, deselected: prepared.receiptSelection.deselected } })
					.where(eq(schema.attachments.id, a.id));
			}
		}
		await audit(tx, {
			groupId,
			personId: userId,
			action: existingId ? 'expense.update' : 'expense.create',
			entityId: id,
			data: { title: prepared.row.title, amount: prepared.row.amount, currency: prepared.row.currency }
		});
	});
	return id;
}
