/**
 * Display names: a name the person chose, or the first name plus as many letters of the last name as needed to
 * be unique among all people (e.g. "Anna", or "Anna J." and "Anna Je." when there are two Annas J…).
 */
export interface NamedPerson {
	id: string;
	/** full name, "First Last" */
	name: string;
	/** chosen display name, if any */
	custom?: string | null;
}

const low = (s: string) => s.toLocaleLowerCase('de');

function split(name: string) {
	const parts = name.trim().split(/\s+/);
	return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

const abbreviate = (first: string, last: string, k: number) => (k >= last.length ? `${first} ${last}` : `${first} ${last.slice(0, k)}.`);

export function computeDisplayNames(people: NamedPerson[]): Map<string, string> {
	const result = new Map<string, string>();
	const taken = new Set<string>();
	for (const p of people) {
		if (p.custom?.trim()) {
			result.set(p.id, p.custom.trim());
			taken.add(low(p.custom.trim()));
		}
	}
	const auto = people.filter((p) => !p.custom?.trim()).map((p) => ({ ...p, ...split(p.name) }));
	const byFirst = new Map<string, typeof auto>();
	for (const p of auto) byFirst.set(low(p.first), [...(byFirst.get(low(p.first)) ?? []), p]);

	for (const group of byFirst.values()) {
		for (const p of group) {
			const others = group.filter((o) => o !== p);
			let display: string;
			if (!others.length && !taken.has(low(p.first))) display = p.first;
			else if (!p.last) display = p.first;
			else {
				// the shortest part of the last name that no other person with this first name shares
				let k = 1;
				while (k < p.last.length && others.some((o) => low(o.last).slice(0, k) === low(p.last).slice(0, k))) k++;
				display = abbreviate(p.first, p.last, k);
				while (taken.has(low(display)) && k < p.last.length) display = abbreviate(p.first, p.last, ++k);
			}
			result.set(p.id, display);
		}
	}
	// still the same (identical names): number them in the given order
	const seen = new Map<string, number>();
	for (const p of people) {
		const d = result.get(p.id)!;
		const n = (seen.get(low(d)) ?? 0) + 1;
		seen.set(low(d), n);
		if (n > 1) result.set(p.id, `${d} (${n})`);
	}
	return result;
}

/** Whether a chosen display name is free (not the display or full name of anybody else). */
export function displayNameFree(wanted: string, personId: string, others: { id: string; name: string; display: string }[]) {
	const w = low(wanted.trim());
	return !others.some((o) => o.id !== personId && (low(o.display) === w || low(o.name) === w));
}
