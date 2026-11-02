import { asc, eq, isNull, sql } from 'drizzle-orm';
import { computeDisplayNames } from '$lib/core/display-names';
import { db, schema } from './db';

/** The name to show for a person (falls back to the full name until the display names are computed). */
export const shownName = sql<string>`coalesce(${schema.persons.display}, ${schema.persons.name})`;

/**
 * Recomputes all display names (after a name changed or a person was added) and keeps the names of personal
 * Kassen in step. Cheap: an instance has few people.
 */
export async function refreshDisplayNames() {
	const people = await db
		.select({ id: schema.persons.id, name: schema.persons.name, custom: schema.persons.displayName, display: schema.persons.display })
		.from(schema.persons)
		.where(isNull(schema.persons.mergedInto))
		.orderBy(asc(schema.persons.createdAt), asc(schema.persons.id));
	const names = computeDisplayNames(people);
	for (const p of people) {
		const d = names.get(p.id)!;
		if (d === p.display) continue;
		await db.update(schema.persons).set({ display: d }).where(eq(schema.persons.id, p.id));
		await db.update(schema.kassen).set({ name: d }).where(eq(schema.kassen.personalOf, p.id));
	}
}
