import { and, eq, gt, isNotNull } from 'drizzle-orm';
import { computeShares } from '$lib/core/split';
import { db, schema } from './db';
import { loadExpenses, loadMembers, loadProfiles, toCoreExpense, toCoreMember } from './groups';

/**
 * Freezes the shares of all expenses up to `until`: later changes of members, factors or
 * profiles no longer change them. Expenses that cannot be split are left out and reported.
 */
export async function closeUntil(groupId: string, until: string) {
	const [members, expenses, profiles] = await Promise.all([loadMembers(groupId), loadExpenses(groupId), loadProfiles(groupId)]);
	const core = members.map(toCoreMember);
	const failed: string[] = [];
	await db.transaction(async (tx) => {
		for (const e of expenses) {
			if (e.date > until || e.frozenShares) continue;
			try {
				const shares = computeShares(toCoreExpense(e, profiles), core);
				await tx.update(schema.expenses).set({ frozenShares: Object.fromEntries(shares) }).where(eq(schema.expenses.id, e.id));
			} catch {
				failed.push(e.title);
			}
		}
		await tx.update(schema.groups).set({ closedUntil: until }).where(eq(schema.groups.id, groupId));
	});
	return { failed };
}

/** Reopens: everything after `from` (or everything) is recalculated dynamically again. */
export async function reopen(groupId: string, from: string | null) {
	await db
		.update(schema.expenses)
		.set({ frozenShares: null })
		.where(
			and(
				eq(schema.expenses.groupId, groupId),
				isNotNull(schema.expenses.frozenShares),
				from ? gt(schema.expenses.date, from) : undefined
			)
		);
	await db.update(schema.groups).set({ closedUntil: from }).where(eq(schema.groups.id, groupId));
}

export function isClosed(group: { closedUntil: string | null }, date: string) {
	return Boolean(group.closedUntil && date <= group.closedUntil);
}

