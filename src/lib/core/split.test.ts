import { describe, expect, it } from 'vitest';
import { allocate, computePaid, computeShares, effectiveFactor, presentUnits } from './split';
import { computeBalances, directTransfers, suggestTransfers } from './balance';
import { convert, parseAmount, rateFromCharged } from './currency';
import type { Expense, Member } from './types';

const m = (personId: string, factor = 1, extra: Partial<Member> = {}): Member => ({
	personId,
	factor,
	tags: [],
	kasseId: personId,
	...extra
});

const expense = (e: Partial<Expense>): Expense => ({
	id: 'e',
	date: '2027-07-10',
	baseAmount: 9000,
	payers: [{ personId: 'anna', amount: 9000 }],
	rule: { type: 'all' },
	...e
});

const obj = (map: Map<string, number>) => Object.fromEntries(map);

describe('allocate', () => {
	it('sums up exactly with largest remainder', () => {
		const r = allocate(1000, new Map([['a', 1], ['b', 1], ['c', 1]]));
		expect([...r.values()].reduce((s, v) => s + v, 0)).toBe(1000);
		expect(obj(r)).toEqual({ a: 334, b: 333, c: 333 });
	});
	it('handles negative totals', () => {
		expect(obj(allocate(-100, new Map([['a', 1], ['b', 2]])))).toEqual({ a: -33, b: -67 });
	});
	it('throws without participants', () => {
		expect(() => allocate(100, new Map())).toThrow();
	});
});

describe('computeShares', () => {
	const family = [m('anna'), m('ben'), m('lea', 0.5, { tags: ['Kind'] }), m('tim', 0.5, { tags: ['Kind'] })];

	it('splits by default factors (concept example)', () => {
		expect(obj(computeShares(expense({}), family))).toEqual({ anna: 3000, ben: 3000, lea: 1500, tim: 1500 });
	});

	it('includes late joiners participating since the start', () => {
		const withCarla = [...family, m('carla')];
		expect(obj(computeShares(expense({}), withCarla))).toEqual({
			anna: 2250, ben: 2250, lea: 1125, tim: 1125, carla: 2250
		});
	});

	it('excludes members not participating on the expense date', () => {
		const withCarla = [...family, m('carla', 1, { from: '2027-07-12' })];
		expect(computeShares(expense({}), withCarla).has('carla')).toBe(false);
	});

	it('supports all_except and only', () => {
		expect(obj(computeShares(expense({ rule: { type: 'all_except', excluded: ['ben'] } }), family))).toEqual({
			anna: 4500, lea: 2250, tim: 2250
		});
		expect(obj(computeShares(expense({ rule: { type: 'only', included: ['anna', 'ben'] } }), family))).toEqual({
			anna: 4500, ben: 4500
		});
	});

	it('applies tag filters and overrides (profile alcohol / accommodation)', () => {
		const alcohol = expense({ rule: { type: 'all', tagFilter: { exclude: ['Kind'] } } });
		expect(obj(computeShares(alcohol, family))).toEqual({ anna: 4500, ben: 4500 });
		const accommodation = expense({ rule: { type: 'all', factorOverrides: { tags: { Kind: 1 } } } });
		expect(obj(computeShares(accommodation, family))).toEqual({ anna: 2250, ben: 2250, lea: 2250, tim: 2250 });
	});

	it('prefers person overrides over tag overrides', () => {
		const lea = m('lea', 0.5, { tags: ['Kind'] });
		expect(effectiveFactor(lea, { tags: { Kind: 1 }, persons: { lea: 0 } })).toBe(0);
	});

	it('supports fixed amounts plus rest', () => {
		const e = expense({ rule: { type: 'all', fixed: { ben: 1200 } } });
		expect(obj(computeShares(e, [m('anna'), m('ben')]))).toEqual({ anna: 3900, ben: 5100 });
	});

	it('supports individual modes', () => {
		const shares = expense({ rule: { type: 'individual', mode: 'shares', values: { anna: 2, ben: 1 } } });
		expect(obj(computeShares(shares, family))).toEqual({ anna: 6000, ben: 3000 });
		const amounts = expense({ rule: { type: 'individual', mode: 'amounts', values: { anna: 5000, ben: 4000 } } });
		expect(obj(computeShares(amounts, family))).toEqual({ anna: 5000, ben: 4000 });
		const wrong = expense({ rule: { type: 'individual', mode: 'amounts', values: { anna: 5000 } } });
		expect(() => computeShares(wrong, family)).toThrow();
	});

	it('only shares the non-private part', () => {
		const e = expense({ baseAmount: 8740, privateAmount: 420, rule: { type: 'all' } });
		expect(obj(computeShares(e, [m('anna'), m('ben')]))).toEqual({ anna: 4160, ben: 4160 });
		expect(obj(computePaid(e))).toEqual({ anna: 8320 });
	});

	it('splits by nights present (concept example 5.7)', () => {
		const people = [m('anna'), m('ben'), m('carla', 1, { from: '2027-08-05' })];
		const e = expense({
			baseAmount: 140000,
			rule: { type: 'all' },
			period: { from: '2027-08-01', to: '2027-08-15', unit: 'nights' }
		});
		expect(presentUnits(people[2], e.period!)).toBe(10);
		expect(obj(computeShares(e, people))).toEqual({ anna: 51579, ben: 51579, carla: 36842 });
	});

	it('counts departure day as not-a-night', () => {
		const leaving = m('x', 1, { to: '2027-08-03' });
		expect(presentUnits(leaving, { from: '2027-08-01', to: '2027-08-15', unit: 'nights' })).toBe(2);
		expect(presentUnits(leaving, { from: '2027-08-01', to: '2027-08-15', unit: 'days' })).toBe(3);
	});
});

describe('balances and transfers', () => {
	it('aggregates persons into Kassen', () => {
		const members = [
			m('anna', 1, { kasseId: 'jacobs' }),
			m('ben', 1, { kasseId: 'jacobs' }),
			m('lea', 0.5, { kasseId: 'jacobs' }),
			m('carla')
		];
		const expenses = [
			expense({ id: '1', baseAmount: 3500, payers: [{ personId: 'carla', amount: 3500 }] }),
			expense({ id: '2', baseAmount: 1400, payers: [{ personId: 'ben', amount: 1400 }] })
		];
		const b = computeBalances(members, expenses, []);
		expect(b.kassen.get('jacobs')!.balance).toBe(1400 - 3500);
		expect(b.kassen.get('carla')!.balance).toBe(3500 - 1400);
		expect(suggestTransfers(new Map([...b.kassen].map(([id, k]) => [id, k.balance])))).toEqual([
			{ from: 'jacobs', to: 'carla', amount: 2100 }
		]);
		const settled = computeBalances(members, expenses, [{ fromKasseId: 'jacobs', toKasseId: 'carla', amount: 2100 }]);
		expect(settled.kassen.get('jacobs')!.balance).toBe(0);
		expect(settled.kassen.get('carla')!.balance).toBe(0);
	});

	it('reports unsplittable expenses instead of failing', () => {
		const b = computeBalances([m('anna')], [expense({ rule: { type: 'only', included: [] } })], []);
		expect(b.errors).toHaveLength(1);
	});

	it('minimizes transfers', () => {
		const t = suggestTransfers(new Map([['a', 3000], ['b', -1000], ['c', -2000]]));
		expect(t).toEqual([
			{ from: 'c', to: 'a', amount: 2000 },
			{ from: 'b', to: 'a', amount: 1000 }
		]);
	});

	it('direct transfers pay back the actual payer', () => {
		const members = [m('a'), m('b'), m('c')];
		const expenses = [
			expense({ id: '1', baseAmount: 3000, payers: [{ personId: 'a', amount: 3000 }] }),
			expense({ id: '2', baseAmount: 3000, payers: [{ personId: 'b', amount: 3000 }] })
		];
		expect(directTransfers(members, expenses, [])).toEqual(
			expect.arrayContaining([
				{ from: 'c', to: 'a', amount: 1000 },
				{ from: 'c', to: 'b', amount: 1000 }
			])
		);
	});
});

describe('currency', () => {
	it('converts between currencies with different minor units', () => {
		expect(convert(4200, 'CHF', 'EUR', 1.0667)).toBe(4480);
		expect(convert(1000, 'JPY', 'EUR', 0.0061)).toBe(610);
		expect(rateFromCharged(4200, 'CHF', 4712, 'EUR')).toBeCloseTo(1.12190, 4);
	});
	it('parses German and English input', () => {
		expect(parseAmount('12,50', 'EUR')).toBe(1250);
		expect(parseAmount('1.234,56', 'EUR')).toBe(123456);
		expect(parseAmount('12.5', 'EUR')).toBe(1250);
		expect(parseAmount('1.234', 'EUR')).toBe(123400);
		expect(parseAmount('1,234.56', 'EUR')).toBe(123456);
		expect(parseAmount('500', 'JPY')).toBe(500);
		expect(parseAmount('abc', 'EUR')).toBeNull();
	});
});
