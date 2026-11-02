import { describe, expect, it } from 'vitest';
import { convertTagRule, usesTags } from './legacy-tags';

const members = [
	{ personId: 'anna', tags: [] },
	{ personId: 'ben', tags: ['Alkohol'] },
	{ personId: 'lea', tags: ['Kind'] },
	{ personId: 'tim', tags: ['Kind'] }
];

describe('convertTagRule', () => {
	it('"without children" becomes "everyone except the children"', () => {
		expect(convertTagRule({ type: 'all', tagFilter: { exclude: ['Kind'] } }, members)).toEqual({ type: 'all_except', excluded: ['lea', 'tim'] });
	});
	it('"only with tag" becomes "only these people"', () => {
		expect(convertTagRule({ type: 'all', tagFilter: { require: ['Alkohol'] } }, members)).toEqual({ type: 'only', included: ['ben'] });
	});
	it('keeps already excluded people', () => {
		expect(convertTagRule({ type: 'all_except', excluded: ['anna'], tagFilter: { exclude: ['Kind'] } }, members)).toEqual({
			type: 'all_except',
			excluded: ['anna', 'lea', 'tim']
		});
	});
	it('narrows an "only" rule', () => {
		expect(convertTagRule({ type: 'only', included: ['anna', 'lea'], tagFilter: { exclude: ['Kind'] } }, members)).toEqual({ type: 'only', included: ['anna'] });
	});
	it('turns tag factors into person factors, person factors win', () => {
		expect(convertTagRule({ type: 'all', factorOverrides: { tags: { Kind: 1 }, persons: { tim: 0 } } }, members)).toEqual({
			type: 'all',
			factorOverrides: { persons: { tim: 0, lea: 1 } }
		});
	});
	it('keeps other settings', () => {
		const r = convertTagRule({ type: 'all', equalWeights: true, tagFilter: { exclude: ['Kind'] } }, members);
		expect(r).toMatchObject({ equalWeights: true });
	});
	it('detects rules with tags', () => {
		expect(usesTags({ type: 'all', tagFilter: {} })).toBe(true);
		expect(usesTags({ type: 'all', factorOverrides: { persons: { a: 1 } } })).toBe(false);
		expect(usesTags(null)).toBe(false);
	});
});
