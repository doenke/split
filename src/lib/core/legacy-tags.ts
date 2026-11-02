import type { SplitRule } from './types';

/**
 * Rules from the time when people had tags ("Merkmale", e.g. "Kind"): a tag filter or tag factors are turned
 * into the same split by concrete people, using the tags the members had in that group.
 */
interface LegacyRule {
	type: SplitRule['type'];
	tagFilter?: { require?: string[]; exclude?: string[] };
	factorOverrides?: { persons?: Record<string, number>; tags?: Record<string, number> };
	excluded?: string[];
	included?: string[];
	[key: string]: unknown;
}

export function usesTags(rule: unknown): boolean {
	const r = rule as LegacyRule | null;
	return Boolean(r && (r.tagFilter || r.factorOverrides?.tags));
}

export function convertTagRule(rule: LegacyRule, members: { personId: string; tags: string[] }[]): SplitRule {
	const { tagFilter, factorOverrides, ...rest } = rule;
	const out = { ...rest } as LegacyRule;

	// tag factors become factors of the people who had the tag (lowest value wins, as before)
	const persons = { ...(factorOverrides?.persons ?? {}) };
	for (const m of members) {
		if (persons[m.personId] !== undefined) continue;
		const values = m.tags.map((t) => factorOverrides?.tags?.[t]).filter((v): v is number => v !== undefined);
		if (values.length) persons[m.personId] = Math.min(...values);
	}
	if (Object.keys(persons).length) out.factorOverrides = { persons };

	if (tagFilter && rule.type !== 'individual') {
		const require = tagFilter.require ?? [];
		const exclude = tagFilter.exclude ?? [];
		const matches = (m: { tags: string[] }) => require.every((t) => m.tags.includes(t)) && !exclude.some((t) => m.tags.includes(t));
		const matching = members.filter(matches).map((m) => m.personId);
		const failing = members.filter((m) => !matches(m)).map((m) => m.personId);
		if (rule.type === 'only') {
			out.included = (rule.included ?? []).filter((id) => matching.includes(id));
		} else if (require.length) {
			// "only people with tag X": exactly those people
			const excluded = rule.type === 'all_except' ? (rule.excluded ?? []) : [];
			out.type = 'only';
			out.included = matching.filter((id) => !excluded.includes(id));
			delete out.excluded;
		} else {
			// "everyone without tag X": everyone except the people who had it (later joiners still take part)
			out.type = 'all_except';
			out.excluded = [...new Set([...(rule.type === 'all_except' ? (rule.excluded ?? []) : []), ...failing])];
		}
	}
	return out as unknown as SplitRule;
}
