import { describe, expect, it } from 'vitest';
import { computeDisplayNames, displayNameFree } from './display-names';

const names = (list: { id: string; name: string; custom?: string }[]) => Object.fromEntries(computeDisplayNames(list));

describe('computeDisplayNames', () => {
	it('uses the first name when it is unique', () => {
		expect(names([{ id: 'a', name: 'Anna Jacobs' }, { id: 'b', name: 'Ben Meyer' }])).toEqual({ a: 'Anna', b: 'Ben' });
	});
	it('adds as many letters of the last name as needed', () => {
		expect(
			names([
				{ id: 'a', name: 'Anna Jacobs' },
				{ id: 'b', name: 'Anna Jensen' },
				{ id: 'c', name: 'Anna Meyer' }
			])
		).toEqual({ a: 'Anna Ja.', b: 'Anna Je.', c: 'Anna M.' });
	});
	it('writes the whole last name when it is short or all letters are needed', () => {
		expect(names([{ id: 'a', name: 'Tom Ek' }, { id: 'b', name: 'Tom Eker' }])).toEqual({ a: 'Tom Ek', b: 'Tom Eke.' });
	});
	it('keeps a person without last name as first name only', () => {
		expect(names([{ id: 'a', name: 'Lea' }, { id: 'b', name: 'Lea Schulz' }])).toEqual({ a: 'Lea', b: 'Lea S.' });
	});
	it('uses chosen names and avoids them', () => {
		expect(names([{ id: 'a', name: 'Sönke Jacobs', custom: 'Papa' }, { id: 'b', name: 'Papa Schmidt' }])).toEqual({ a: 'Papa', b: 'Papa S.' });
	});
	it('numbers identical names', () => {
		expect(names([{ id: 'a', name: 'Max Muster' }, { id: 'b', name: 'Max Muster' }])).toEqual({ a: 'Max Muster', b: 'Max Muster (2)' });
	});
});

describe('displayNameFree', () => {
	const others = [{ id: 'b', name: 'Anna Jacobs', display: 'Anna' }];
	it('rejects names that exist', () => {
		expect(displayNameFree('anna', 'a', others)).toBe(false);
		expect(displayNameFree('Anna Jacobs', 'a', others)).toBe(false);
		expect(displayNameFree('Annie', 'a', others)).toBe(true);
		expect(displayNameFree('Anna', 'b', others)).toBe(true);
	});
});
