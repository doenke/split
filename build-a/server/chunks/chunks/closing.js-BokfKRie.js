import { and, eq, isNotNull } from 'drizzle-orm';
import { a as computeShares } from './split.js-Diu3SqNm.js';
import { d as db, b as expenses, g as groups } from './index3.js-LeA4cvVT.js';
import { l as loadMembers, a as loadExpenses, b as loadProfiles, t as toCoreMember, c as toCoreExpense } from './groups.js-By2r4Rg8.js';

async function closeUntil(groupId, until) {
  const [members, expenses$1, profiles] = await Promise.all([loadMembers(groupId), loadExpenses(groupId), loadProfiles(groupId)]);
  const core = members.map(toCoreMember);
  const failed = [];
  await db.transaction(async (tx) => {
    for (const e of expenses$1) {
      if (e.date > until || e.frozenShares) continue;
      try {
        const shares = computeShares(toCoreExpense(e, profiles), core);
        await tx.update(expenses).set({ frozenShares: Object.fromEntries(shares) }).where(eq(expenses.id, e.id));
      } catch {
        failed.push(e.title);
      }
    }
    await tx.update(groups).set({ closedUntil: until }).where(eq(groups.id, groupId));
  });
  return { failed };
}
async function reopen(groupId, from) {
  await db.update(expenses).set({ frozenShares: null }).where(
    and(
      eq(expenses.groupId, groupId),
      isNotNull(expenses.frozenShares),
      void 0
    )
  );
  await db.update(groups).set({ closedUntil: from }).where(eq(groups.id, groupId));
}
function isClosed(group, date) {
  return Boolean(group.closedUntil && date <= group.closedUntil);
}

export { closeUntil as c, isClosed as i, reopen as r };
//# sourceMappingURL=closing.js-BokfKRie.js.map
