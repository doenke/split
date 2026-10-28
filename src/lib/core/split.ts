import type { Expense, FactorOverrides, IsoDate, Member, Minor, Period, SplitRule } from './types';

export class SplitError extends Error {}

/**
 * Distributes `total` proportionally to `weights` using the largest remainder method.
 * The result always sums up to exactly `total`. Ties are broken by insertion order.
 */
export function allocate(total: Minor, weights: Map<string, number>): Map<string, Minor> {
	const result = new Map<string, Minor>();
	const entries = [...weights.entries()].filter(([, w]) => w > 0);
	const sum = entries.reduce((s, [, w]) => s + w, 0);
	for (const id of weights.keys()) result.set(id, 0);
	if (total === 0) return result;
	if (sum <= 0) throw new SplitError('Niemand ist an dieser Ausgabe beteiligt.');

	const sign = total < 0 ? -1 : 1;
	const abs = Math.abs(total);
	let distributed = 0;
	const remainders: { id: string; rem: number; idx: number }[] = [];
	entries.forEach(([id, w], idx) => {
		const exact = (abs * w) / sum;
		const floor = Math.floor(exact + 1e-9);
		result.set(id, floor);
		distributed += floor;
		remainders.push({ id, rem: exact - floor, idx });
	});
	remainders.sort((a, b) => b.rem - a.rem || a.idx - b.idx);
	for (let i = 0; i < abs - distributed; i++) {
		const r = remainders[i % remainders.length];
		result.set(r.id, result.get(r.id)! + 1);
	}
	if (sign < 0) for (const [id, v] of result) result.set(id, -v);
	return result;
}

function dayNumber(d: IsoDate): number {
	return Math.round(Date.parse(d + 'T00:00:00Z') / 86_400_000);
}

export function isActiveOn(member: Member, date: IsoDate): boolean {
	if (member.from && date < member.from) return false;
	if (member.to && date > member.to) return false;
	return true;
}

/** Number of days (or nights) of `period` during which the member participates. */
export function presentUnits(member: Member, period: Period): number {
	const pStart = dayNumber(period.from);
	// nights: a night belongs to the day it starts on, so the last counted day is `to - 1`
	const pEnd = dayNumber(period.to) - (period.unit === 'nights' ? 1 : 0);
	const mStart = member.from ? dayNumber(member.from) : -Infinity;
	// leaving on day X means the last night is X - 1
	const mEnd = member.to ? dayNumber(member.to) - (period.unit === 'nights' ? 1 : 0) : Infinity;
	const start = Math.max(pStart, mStart);
	const end = Math.min(pEnd, mEnd);
	return Math.max(0, end - start + 1);
}

function matchesTagFilter(member: Member, rule: SplitRule): boolean {
	const f = rule.tagFilter;
	if (!f) return true;
	if (f.require?.some((t) => !member.tags.includes(t))) return false;
	if (f.exclude?.some((t) => member.tags.includes(t))) return false;
	return true;
}

/**
 * Effective factor: person override > tag override (lowest matching value) > member default.
 */
export function effectiveFactor(member: Member, overrides?: FactorOverrides): number {
	const p = overrides?.persons?.[member.personId];
	if (p !== undefined) return p;
	const tagValues = member.tags
		.map((t) => overrides?.tags?.[t])
		.filter((v): v is number => v !== undefined);
	if (tagValues.length) return Math.min(...tagValues);
	return member.factor;
}

/** Members taking part in an expense according to its rule (before weighting). */
export function participants(members: Member[], rule: SplitRule, date: IsoDate, period?: Period): Member[] {
	const active = (m: Member) => (period ? presentUnits(m, period) > 0 : isActiveOn(m, date));
	switch (rule.type) {
		case 'all':
			return members.filter((m) => active(m) && matchesTagFilter(m, rule));
		case 'all_except':
			return members.filter(
				(m) => active(m) && matchesTagFilter(m, rule) && !rule.excluded.includes(m.personId)
			);
		case 'only':
			// explicitly chosen people take part regardless of their participation dates
			return members.filter((m) => rule.included.includes(m.personId) && matchesTagFilter(m, rule));
		case 'individual':
			return members.filter((m) => (rule.values[m.personId] ?? 0) > 0);
	}
}

/**
 * Computes how much each person consumed of an expense (in base currency minor units).
 * Private parts are excluded: only `baseAmount - privateAmount` is shared.
 */
export function computeShares(expense: Expense, members: Member[]): Map<string, Minor> {
	if (expense.frozenShares) return new Map(Object.entries(expense.frozenShares));

	const rule = expense.rule;
	const shared = expense.baseAmount - (expense.privateAmount ?? 0);
	const shares = new Map<string, Minor>();

	if (rule.type === 'individual' && rule.mode === 'amounts') {
		let sum = 0;
		for (const [id, v] of Object.entries(rule.values)) {
			if (v === 0) continue;
			shares.set(id, v);
			sum += v;
		}
		if (sum !== shared) {
			throw new SplitError(
				`Die Einzelbeträge (${sum}) ergeben nicht den Gesamtbetrag (${shared}).`
			);
		}
		return shares;
	}

	let rest = shared;
	for (const [id, v] of Object.entries(rule.fixed ?? {})) {
		shares.set(id, (shares.get(id) ?? 0) + v);
		rest -= v;
	}
	if (rest === 0) return shares;

	const weights = new Map<string, number>();
	for (const m of participants(members, rule, expense.date, expense.period)) {
		let w: number;
		if (rule.type === 'individual') {
			w = rule.values[m.personId] ?? 0;
		} else {
			w = rule.equalWeights ? 1 : effectiveFactor(m, rule.factorOverrides);
			if (expense.period) w *= presentUnits(m, expense.period);
		}
		if (w > 0) weights.set(m.personId, w);
	}
	for (const [id, v] of allocate(rest, weights)) shares.set(id, (shares.get(id) ?? 0) + v);
	return shares;
}

/** Credit of each payer for the shared part of the expense. */
export function computePaid(expense: Expense): Map<string, Minor> {
	const shared = expense.baseAmount - (expense.privateAmount ?? 0);
	const weights = new Map<string, number>();
	for (const p of expense.payers) weights.set(p.personId, (weights.get(p.personId) ?? 0) + p.amount);
	return allocate(shared, weights);
}
