import { and, isNotNull, lt } from 'drizzle-orm';
import { db, schema } from './db';

export const TRASH_DAYS = 30;

/** Permanently removes what has been in the trash for longer than TRASH_DAYS. */
export async function purgeTrash() {
	const before = new Date(Date.now() - TRASH_DAYS * 86_400_000);
	await db.delete(schema.expenses).where(and(isNotNull(schema.expenses.deletedAt), lt(schema.expenses.deletedAt, before)));
	await db.delete(schema.settlements).where(and(isNotNull(schema.settlements.deletedAt), lt(schema.settlements.deletedAt, before)));
	await db.delete(schema.groups).where(and(isNotNull(schema.groups.deletedAt), lt(schema.groups.deletedAt, before)));
}
