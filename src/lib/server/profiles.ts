import type { SplitRule } from '$lib/core/types';

/** Builds a profile rule from the editor form. */
export function ruleFromForm(f: FormData, memberIds: string[]): SplitRule {
	const num = (v: FormDataEntryValue | null) => {
		const n = parseFloat(String(v ?? '').replace(',', '.'));
		return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
	};
	// the people taking part, each with an optional own factor
	const picked = f.getAll('person').map(String).filter((id) => memberIds.includes(id));
	const persons: Record<string, number> = {};
	for (const id of picked) {
		const n = num(f.get(`factor_${id}`));
		if (n !== null) persons[id] = n;
	}
	const overrides = Object.keys(persons).length ? { factorOverrides: { persons } } : {};
	// "everyone (except …)": people joining later take part automatically
	if (f.get('mode') === 'all') {
		const excluded = memberIds.filter((id) => !picked.includes(id));
		return excluded.length ? { type: 'all_except', excluded, ...overrides } : { type: 'all', ...overrides };
	}
	return { type: 'only', included: picked, ...overrides };
}
