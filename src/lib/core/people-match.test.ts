import { describe, expect, it } from 'vitest';
import { exactMatch, suggestions } from './people-match';

const persons = [
	{ id: 'p1', name: 'Lea M', fullName: 'Lea Müller' },
	{ id: 'p2', name: 'Lea S', fullName: 'Lea Schmidt' },
	{ id: 'p3', name: 'Tom', fullName: 'Tom Becker' },
	{ id: 'p4', name: 'Ben K', fullName: 'Ben Krause' },
	{ id: 'p5', name: 'Ben Krause (Kiel)', fullName: 'Ben Krause' }
];
const kassen = [
	{ id: 'k1', name: 'Familie Müller', missing: ['Lea M', 'Max'] },
	{ id: 'k2', name: 'Die Beckers', missing: ['Mia'], members: ['Tom', 'Tom Becker', 'Mia', 'Mia Becker'] }
];

describe('exactMatch', () => {
	it('takes a known person by display or full name, ignoring case and spaces', () => {
		expect(exactMatch('lea m', persons, kassen)).toMatchObject({ kind: 'person', person: { id: 'p1' } });
		expect(exactMatch('  Tom   Becker ', persons, kassen)).toMatchObject({ kind: 'person', person: { id: 'p3' } });
	});
	it('takes a Kasse by its name', () => {
		expect(exactMatch('Familie Müller', persons, kassen)).toMatchObject({ kind: 'kasse', kasse: { id: 'k1' } });
	});
	it('reports a full name shared by several people', () => {
		expect(exactMatch('Ben Krause', persons, kassen)).toMatchObject({ kind: 'ambiguous' });
		expect(exactMatch('Ben K', persons, kassen)).toMatchObject({ kind: 'person', person: { id: 'p4' } });
	});
	it('is new otherwise', () => {
		expect(exactMatch('Lea', persons, kassen).kind).toBe('new');
		expect(exactMatch(' ', persons, kassen).kind).toBe('empty');
	});
});

describe('suggestions', () => {
	it('finds people and Kassen, best matches first', () => {
		const s = suggestions('mül', persons, kassen);
		expect(s.map((x) => (x.kind === 'person' ? x.person.id : x.kasse.id))).toEqual(['k1', 'p1']);
		expect(suggestions('le', persons, kassen).map((x) => (x.kind === 'person' ? x.person.id : x.kasse.id))).toEqual(['p1', 'p2', 'k1']);
		expect(suggestions('', persons, kassen)).toEqual([]);
	});
	it("offers a person's Kasse right after them", () => {
		expect(suggestions('tom', persons, kassen).map((x) => (x.kind === 'person' ? x.person.id : x.kasse.id))).toEqual(['p3', 'k2']);
	});
});
