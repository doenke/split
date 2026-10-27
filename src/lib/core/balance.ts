import { computePaid, computeShares } from './split';
import type { Expense, Member, Minor, Settlement, Transfer } from './types';

export interface PersonBalance {
	personId: string;
	paid: Minor;
	consumed: Minor;
	/** paid - consumed; positive = gets money back */
	balance: Minor;
}

export interface KasseBalance {
	kasseId: string;
	personIds: string[];
	paid: Minor;
	consumed: Minor;
	settlementsSent: Minor;
	settlementsReceived: Minor;
	/** paid - consumed + sent - received; positive = gets money back */
	balance: Minor;
}

export interface GroupBalances {
	persons: Map<string, PersonBalance>;
	kassen: Map<string, KasseBalance>;
	/** Expenses that could not be split (e.g. nobody participates), with the reason. */
	errors: { expenseId: string; message: string }[];
}

export function computeBalances(
	members: Member[],
	expenses: Expense[],
	settlements: Settlement[]
): GroupBalances {
	const persons = new Map<string, PersonBalance>();
	const person = (id: string) => {
		let p = persons.get(id);
		if (!p) persons.set(id, (p = { personId: id, paid: 0, consumed: 0, balance: 0 }));
		return p;
	};
	for (const m of members) person(m.personId);

	const errors: GroupBalances['errors'] = [];
	for (const e of expenses) {
		let paid: Map<string, Minor>, shares: Map<string, Minor>;
		try {
			paid = computePaid(e);
			shares = computeShares(e, members);
		} catch (err) {
			errors.push({ expenseId: e.id, message: (err as Error).message });
			continue;
		}
		for (const [id, v] of paid) person(id).paid += v;
		for (const [id, v] of shares) person(id).consumed += v;
	}
	for (const p of persons.values()) p.balance = p.paid - p.consumed;

	const kasseOf = new Map(members.map((m) => [m.personId, m.kasseId]));
	const kassen = new Map<string, KasseBalance>();
	const kasse = (id: string) => {
		let k = kassen.get(id);
		if (!k)
			kassen.set(
				id,
				(k = {
					kasseId: id,
					personIds: [],
					paid: 0,
					consumed: 0,
					settlementsSent: 0,
					settlementsReceived: 0,
					balance: 0
				})
			);
		return k;
	};
	for (const p of persons.values()) {
		// people who are no longer members still count with their own id as Kasse
		const k = kasse(kasseOf.get(p.personId) ?? p.personId);
		k.personIds.push(p.personId);
		k.paid += p.paid;
		k.consumed += p.consumed;
	}
	for (const s of settlements) {
		kasse(s.fromKasseId).settlementsSent += s.amount;
		kasse(s.toKasseId).settlementsReceived += s.amount;
	}
	for (const k of kassen.values()) {
		k.balance = k.paid - k.consumed + k.settlementsSent - k.settlementsReceived;
	}
	return { persons, kassen, errors };
}

/**
 * Suggests transfers that settle all balances with few payments
 * (greedy: largest debtor pays largest creditor).
 */
export function suggestTransfers(balances: Map<string, Minor>): Transfer[] {
	const debtors = [...balances].filter(([, b]) => b < 0).map(([id, b]) => ({ id, amount: -b }));
	const creditors = [...balances].filter(([, b]) => b > 0).map(([id, b]) => ({ id, amount: b }));
	const byAmount = (a: { amount: number; id: string }, b: { amount: number; id: string }) =>
		b.amount - a.amount || a.id.localeCompare(b.id);
	const transfers: Transfer[] = [];
	debtors.sort(byAmount);
	creditors.sort(byAmount);
	while (debtors.length && creditors.length) {
		const d = debtors[0];
		const c = creditors[0];
		const amount = Math.min(d.amount, c.amount);
		transfers.push({ from: d.id, to: c.id, amount });
		d.amount -= amount;
		c.amount -= amount;
		if (d.amount === 0) debtors.shift();
		if (c.amount === 0) creditors.shift();
		debtors.sort(byAmount);
		creditors.sort(byAmount);
	}
	return transfers;
}

/**
 * Transfers without debt simplification: everyone pays back the people who actually paid
 * for them (netted per pair of Kassen). May differ by a cent per expense due to rounding.
 */
export function directTransfers(members: Member[], expenses: Expense[], settlements: Settlement[]): Transfer[] {
	const kasseOf = new Map(members.map((m) => [m.personId, m.kasseId]));
	const k = (id: string) => kasseOf.get(id) ?? id;
	// net[a][b] = amount a owes b
	const net = new Map<string, number>();
	const add = (from: string, to: string, amount: number) => {
		if (from === to || amount === 0) return;
		const key = from < to ? `${from}|${to}` : `${to}|${from}`;
		const sign = from < to ? 1 : -1;
		net.set(key, (net.get(key) ?? 0) + sign * amount);
	};
	for (const e of expenses) {
		let paid: Map<string, Minor>, shares: Map<string, Minor>;
		try {
			paid = computePaid(e);
			shares = computeShares(e, members);
		} catch {
			continue;
		}
		const total = [...paid.values()].reduce((s, v) => s + v, 0);
		if (total === 0) continue;
		for (const [consumer, share] of shares) {
			for (const [payer, p] of paid) add(k(consumer), k(payer), Math.round((share * p) / total));
		}
	}
	for (const s of settlements) add(s.toKasseId, s.fromKasseId, s.amount);
	const transfers: Transfer[] = [];
	for (const [key, v] of net) {
		const [a, b] = key.split('|');
		if (v > 0) transfers.push({ from: a, to: b, amount: v });
		else if (v < 0) transfers.push({ from: b, to: a, amount: -v });
	}
	return transfers.sort((x, y) => y.amount - x.amount);
}
