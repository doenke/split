import { client } from './db';
import { convertTagRule, usesTags } from '$lib/core/legacy-tags';

/**
 * Tags ("Merkmale") were removed. Before the column goes away, profiles and expenses that split by tags are
 * converted once into the same split by concrete people – so no statement changes. Runs only while the old
 * column still exists, i.e. once.
 */
export async function convertTagRules() {
	const [col] = await client`select 1 from information_schema.columns where table_name = 'memberships' and column_name = 'tags'`;
	if (!col) return;
	const members = await client<{ group_id: string; person_id: string; tags: string[] }[]>`select group_id, person_id, tags from memberships`;
	const byGroup = new Map<string, { personId: string; tags: string[] }[]>();
	for (const m of members) byGroup.set(m.group_id, [...(byGroup.get(m.group_id) ?? []), { personId: m.person_id, tags: m.tags ?? [] }]);

	let converted = 0;
	for (const table of ['profiles', 'expenses'] as const) {
		const rows = await client<{ id: string; group_id: string; rule: unknown }[]>`select id, group_id, rule from ${client(table)} where rule is not null`;
		for (const row of rows) {
			const stored = typeof row.rule === 'string' ? JSON.parse(row.rule) : row.rule;
			if (!usesTags(stored)) continue;
			const rule = convertTagRule(stored, byGroup.get(row.group_id) ?? []);
			// drizzle's client expects JSON already serialized
			await client`update ${client(table)} set rule = ${JSON.stringify(rule)}::jsonb where id = ${row.id}`;
			converted++;
		}
	}
	if (converted) console.info(`Merkmale entfernt: ${converted} Aufteilung(en) auf Personen umgestellt.`);
}
