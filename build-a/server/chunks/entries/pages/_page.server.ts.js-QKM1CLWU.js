import { N as redirect, C as error } from '../../chunks/utils.js-BjQHIhHk.js';
import { and, eq, isNull, count, isNotNull } from 'drizzle-orm';
import { a as audit } from '../../chunks/audit.js-DeGbxmfN.js';
import { d as db, m as memberships, g as groups, b as expenses } from '../../chunks/index3.js-LeA4cvVT.js';
import { d as loadGroupState } from '../../chunks/groups.js-By2r4Rg8.js';

const load = async ({ locals }) => {
  if (!locals.user) redirect(303, "/login");
  const me = locals.user.id;
  const rows = await db.select({ group: groups, kasseId: memberships.kasseId }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).where(and(eq(memberships.personId, me), isNull(groups.deletedAt)));
  const groups$1 = await Promise.all(
    rows.map(async ({ group, kasseId }) => {
      const state = await loadGroupState(group.id);
      const kasse = state.balances.kassen.get(kasseId);
      const [{ drafts }] = await db.select({ drafts: count() }).from(expenses).where(and(eq(expenses.groupId, group.id), eq(expenses.status, "draft"), isNull(expenses.deletedAt)));
      return {
        id: group.id,
        name: group.name,
        emoji: group.emoji,
        status: group.status,
        currency: group.baseCurrency,
        startDate: group.startDate,
        memberCount: state.members.length,
        drafts,
        myBalance: kasse?.balance ?? 0,
        lastActivity: state.expenses[0]?.date ?? group.createdAt.toISOString().slice(0, 10)
      };
    })
  );
  const deleted = await db.select({ id: groups.id, name: groups.name, emoji: groups.emoji, deletedAt: groups.deletedAt }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).where(and(eq(memberships.personId, me), eq(memberships.role, "admin"), isNotNull(groups.deletedAt)));
  groups$1.sort((a, b) => (a.status === "archived" ? 1 : 0) - (b.status === "archived" ? 1 : 0) || b.lastActivity.localeCompare(a.lastActivity));
  return { groups: groups$1, deleted };
};
const actions = {
  restoreGroup: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    const id = String((await request.formData()).get("id"));
    const [m] = await db.select().from(memberships).where(and(eq(memberships.groupId, id), eq(memberships.personId, locals.user.id), eq(memberships.role, "admin")));
    if (!m) error(403);
    await db.update(groups).set({ deletedAt: null }).where(eq(groups.id, id));
    await audit(db, { groupId: id, personId: locals.user.id, action: "group.restore", entityId: id });
    redirect(303, `/gruppen/${id}`);
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-QKM1CLWU.js.map
