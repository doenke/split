/**
 * Adding people to a group from one name field: known people and Kassen are suggested while typing,
 * and typing (or picking) the exact name of one of them takes that one instead of creating someone new.
 */

export interface KnownPerson {
	id: string;
	/** display name (unique) */
	name: string;
	fullName: string;
}
export interface KnownKasse {
	id: string;
	name: string;
	/** names of its members not yet in the group */
	missing: string[];
	/** names of all its members (display and full names): searching for a person also offers their Kasse */
	members?: string[];
}

export type Match =
	| { kind: 'person'; person: KnownPerson }
	| { kind: 'kasse'; kasse: KnownKasse }
	| { kind: 'ambiguous'; people: KnownPerson[] }
	| { kind: 'new' }
	| { kind: 'empty' };

export const normName = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');

/** What the typed name means: a known person, a Kasse, or someone new. */
export function exactMatch(text: string, persons: KnownPerson[], kassen: KnownKasse[]): Match {
	const q = normName(text);
	if (!q) return { kind: 'empty' };
	// display names are unique, full names not necessarily
	const byDisplay = persons.find((p) => normName(p.name) === q);
	if (byDisplay) return { kind: 'person', person: byDisplay };
	const byFull = persons.filter((p) => normName(p.fullName) === q);
	if (byFull.length === 1) return { kind: 'person', person: byFull[0] };
	if (byFull.length > 1) return { kind: 'ambiguous', people: byFull };
	const kasse = kassen.find((k) => normName(k.name) === q);
	if (kasse) return { kind: 'kasse', kasse };
	return { kind: 'new' };
}

export type Suggestion = { kind: 'person'; person: KnownPerson } | { kind: 'kasse'; kasse: KnownKasse };

/** Known people and Kassen whose name contains what was typed – those starting with it first. */
export function suggestions(text: string, persons: KnownPerson[], kassen: KnownKasse[], max = 6): Suggestion[] {
	const q = normName(text);
	if (!q) return [];
	const score = (...names: string[]) => {
		let best = -1;
		for (const n of names.map(normName)) {
			if (n.startsWith(q)) best = Math.max(best, 2);
			else if (n.split(' ').some((w) => w.startsWith(q))) best = Math.max(best, 1);
			else if (n.includes(q)) best = Math.max(best, 0);
		}
		return best;
	};
	const found: { s: Suggestion; score: number; name: string }[] = [];
	for (const p of persons) {
		const sc = score(p.name, p.fullName);
		if (sc >= 0) found.push({ s: { kind: 'person', person: p }, score: sc, name: p.name });
	}
	for (const k of kassen) {
		// a Kasse found by one of its members comes right after that member
		const sc = Math.max(score(k.name), score(...(k.members ?? k.missing)) - 0.5);
		if (sc >= 0) found.push({ s: { kind: 'kasse', kasse: k }, score: sc, name: k.name });
	}
	return found
		.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'de'))
		.slice(0, max)
		.map((f) => f.s);
}
