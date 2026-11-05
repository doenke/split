import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db, schema } from './db';
import { newId } from './ids';
import { loadGroupState } from './groups';

/** Groups that have been square (all paid back) for this long go to the archive by themselves. */
export const AUTO_ARCHIVE_DAYS = 30;

/**
 * Since when a settled group without open transfers is square: the final statement, its last payment,
 * or the last time someone took it out of the archive (so it doesn't go straight back).
 */
async function squareSince(groupId: string, settlements: { createdAt: Date }[]) {
	const [last] = await db
		.select({ at: schema.auditLog.createdAt })
		.from(schema.auditLog)
		.where(and(eq(schema.auditLog.groupId, groupId), inArray(schema.auditLog.action, ['group.final', 'group.unarchive'])))
		.orderBy(desc(schema.auditLog.createdAt))
		.limit(1);
	const times = [last?.at, ...settlements.map((s) => s.createdAt)].filter((t): t is Date => !!t).map((t) => t.getTime());
	return times.length ? new Date(Math.max(...times)) : null;
}

/** Runs hourly: archives groups that have been square for AUTO_ARCHIVE_DAYS. */
export async function autoArchive() {
	const settled = await db
		.select({ id: schema.groups.id })
		.from(schema.groups)
		.where(and(eq(schema.groups.status, 'settled'), isNull(schema.groups.archivedAt), isNull(schema.groups.deletedAt)));
	const limit = Date.now() - AUTO_ARCHIVE_DAYS * 86_400_000;
	for (const { id } of settled) {
		const state = await loadGroupState(id);
		if (state.transfers.length) continue;
		const since = await squareSince(id, state.settlements);
		if (!since || since.getTime() > limit) continue;
		await db.update(schema.groups).set({ archivedAt: new Date() }).where(eq(schema.groups.id, id));
		// no person: Split did it
		await db.insert(schema.auditLog).values({ id: newId(), groupId: id, personId: null, action: 'group.archive', data: { auto: true } });
	}
}
