import { C as error } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq, isNotNull, desc } from 'drizzle-orm';
import { d as db, s as settlements, b as expenses } from '../../../../../chunks/index3.js-LeA4cvVT.js';
import { r as requireGroup, f as canEditExpense } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { a as audit } from '../../../../../chunks/audit.js-DeGbxmfN.js';
import { T as TRASH_DAYS } from '../../../../../chunks/trash.js-B9bmgopN.js';

const load = async ({ params, locals }) => {
  await requireGroup(params.id, locals.user);
  const expenses$1 = await db.select().from(expenses).where(and(eq(expenses.groupId, params.id), isNotNull(expenses.deletedAt))).orderBy(desc(expenses.deletedAt));
  const settlements$1 = await db.select().from(settlements).where(and(eq(settlements.groupId, params.id), isNotNull(settlements.deletedAt))).orderBy(desc(settlements.deletedAt));
  return { trashExpenses: expenses$1, trashSettlements: settlements$1, trashDays: TRASH_DAYS };
};
const actions = {
  restoreExpense: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const id = String((await request.formData()).get("id"));
    const [e] = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.groupId, params.id)));
    if (!e) error(404);
    if (!canEditExpense(g, g.user.id, e)) error(403);
    await db.update(expenses).set({ deletedAt: null }).where(eq(expenses.id, id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "expense.restore", entityId: id, data: { title: e.title } });
    return { restored: true };
  },
  restoreSettlement: async ({ params, locals, request }) => {
    const g = await requireGroup(params.id, locals.user);
    const id = String((await request.formData()).get("id"));
    const [s] = await db.select().from(settlements).where(and(eq(settlements.id, id), eq(settlements.groupId, params.id)));
    if (!s) error(404);
    if (![s.fromKasseId, s.toKasseId].includes(g.membership.kasseId) && !g.isAdmin) error(403);
    await db.update(settlements).set({ deletedAt: null }).where(eq(settlements.id, id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "settlement.restore", entityId: id });
    return { restored: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-CNBk-E_j.js.map
