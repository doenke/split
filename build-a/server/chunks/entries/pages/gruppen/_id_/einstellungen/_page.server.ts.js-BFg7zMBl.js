import { O as fail, C as error, N as redirect } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { eq, and } from 'drizzle-orm';
import { d as db, g as groups, m as memberships, l as auditLog } from '../../../../../chunks/index3.js-LeA4cvVT.js';
import { h as requireGroupAdmin, r as requireGroup } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { a as audit } from '../../../../../chunks/audit.js-DeGbxmfN.js';
import { r as reopen, c as closeUntil } from '../../../../../chunks/closing.js-BokfKRie.js';
import { r as resetCompletion } from '../../../../../chunks/completion.js-DPOSbHRR.js';

const load = async ({ params, locals }) => {
  const g = await requireGroup(params.id, locals.user);
  const log = await db.select().from(auditLog).where(eq(auditLog.groupId, params.id)).orderBy(auditLog.createdAt);
  return { log: log.slice(-30).reverse(), muted: g.membership.muted };
};
const actions = {
  save: async ({ params, locals, request }) => {
    const g = await requireGroupAdmin(params.id, locals.user);
    const f = await request.formData();
    const name = String(f.get("name") ?? "").trim();
    if (!name) return fail(400, { message: "Name fehlt." });
    const startDate = String(f.get("startDate") ?? "") || null;
    const endDate = String(f.get("endDate") ?? "") || null;
    const status = ["active", "settled", "archived"].find((s) => s === f.get("status")) ?? "active";
    const settings = {
      simplifyDebts: f.get("simplifyDebts") === "on",
      editOthers: f.get("editOthers") === "admins" ? "admins" : "all",
      membersCanAddPeople: f.get("membersCanAddPeople") === "on"
    };
    await db.update(groups).set({ name, emoji: String(f.get("emoji") ?? "").trim() || g.group.emoji, startDate, endDate, status, settings }).where(eq(groups.id, params.id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "group.update", entityId: params.id });
    return { saved: true };
  },
  toggleMute: async ({ params, locals }) => {
    const g = await requireGroup(params.id, locals.user);
    await db.update(memberships).set({ muted: !g.membership.muted }).where(and(eq(memberships.groupId, params.id), eq(memberships.personId, g.user.id)));
    return { muted: !g.membership.muted };
  },
  close: async ({ params, locals, request }) => {
    const g = await requireGroupAdmin(params.id, locals.user);
    const until = String((await request.formData()).get("until") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return fail(400, { message: "Bitte ein Datum angeben." });
    const { failed } = await closeUntil(params.id, until);
    await audit(db, { groupId: params.id, personId: g.user.id, action: "group.close", data: { until } });
    return { closed: true, failed };
  },
  reopen: async ({ params, locals }) => {
    const g = await requireGroupAdmin(params.id, locals.user);
    await reopen(params.id, null);
    await resetCompletion(params.id);
    await audit(db, { groupId: params.id, personId: g.user.id, action: "group.reopen" });
    return { reopened: true };
  },
  delete: async ({ params, locals, request }) => {
    const g = await requireGroupAdmin(params.id, locals.user);
    const confirmName = String((await request.formData()).get("confirm") ?? "");
    if (confirmName !== g.group.name) return fail(400, { message: "Zum Löschen bitte den Gruppennamen exakt eingeben." });
    if (!g.user.isOidc && g.group.createdBy !== g.user.id) error(403);
    await db.update(groups).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(groups.id, params.id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "group.delete", entityId: params.id });
    redirect(303, "/");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-BFg7zMBl.js.map
