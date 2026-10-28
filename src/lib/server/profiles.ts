import type { SplitRule } from '$lib/core/types';
import type { Tx } from './db';
import { db, schema } from './db';
import { newId } from './ids';

export const defaultProfiles: { name: string; icon: string; rule: SplitRule; defaultCategoryId: string | null }[] = [
	{ name: 'Alkohol', icon: '🍺', rule: { type: 'all', tagFilter: { exclude: ['Kind'] } }, defaultCategoryId: 'food' },
	{ name: 'Unterkunft', icon: '🏠', rule: { type: 'all', factorOverrides: { tags: { Kind: 1 } } }, defaultCategoryId: 'accommodation' }
];

export async function createDefaultProfiles(tx: Tx | typeof db, groupId: string) {
	await tx.insert(schema.profiles).values(
		defaultProfiles.map((p, i) => ({ id: newId(), groupId, sort: i, ...p }))
	);
}

/** Builds a profile rule from the editor form. */
export function ruleFromForm(f: FormData, memberIds: string[]): SplitRule {
	const num = (v: FormDataEntryValue | null) => {
		const n = parseFloat(String(v ?? '').replace(',', '.'));
		return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
	};
	// concrete people, each with an optional own factor
	if (f.get('mode') === 'persons') {
		const included = f.getAll('person').map(String).filter((id) => memberIds.includes(id));
		const persons: Record<string, number> = {};
		for (const id of included) {
			const n = num(f.get(`factor_${id}`));
			if (n !== null) persons[id] = n;
		}
		const rule: SplitRule = { type: 'only', included };
		if (Object.keys(persons).length) rule.factorOverrides = { persons };
		return rule;
	}
	const list = (key: string) =>
		[...new Set(String(f.get(key) ?? '').split(',').map((t) => t.trim()).filter(Boolean))];
	const require = list('require');
	const exclude = list('exclude');
	const tags: Record<string, number> = {};
	const names = f.getAll('overrideTag').map(String);
	const values = f.getAll('overrideFactor').map(String);
	names.forEach((t, i) => {
		const n = parseFloat((values[i] ?? '').replace(',', '.'));
		if (t.trim() && Number.isFinite(n) && n >= 0) tags[t.trim()] = n;
	});
	const rule: SplitRule = { type: 'all' };
	if (require.length || exclude.length) {
		rule.tagFilter = {};
		if (require.length) rule.tagFilter.require = require;
		if (exclude.length) rule.tagFilter.exclude = exclude;
	}
	if (Object.keys(tags).length) rule.factorOverrides = { tags };
	return rule;
}
