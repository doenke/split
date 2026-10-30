import { and, isNotNull, lt } from 'drizzle-orm';
import { d as db, b as expenses, s as settlements, g as groups } from './index3.js-LeA4cvVT.js';

const TRASH_DAYS = 30;
async function purgeTrash() {
  const before = new Date(Date.now() - TRASH_DAYS * 864e5);
  await db.delete(expenses).where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, before)));
  await db.delete(settlements).where(and(isNotNull(settlements.deletedAt), lt(settlements.deletedAt, before)));
  await db.delete(groups).where(and(isNotNull(groups.deletedAt), lt(groups.deletedAt, before)));
}

export { TRASH_DAYS as T, purgeTrash as p };
//# sourceMappingURL=trash.js-B9bmgopN.js.map
