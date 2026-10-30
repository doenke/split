import { O as fail, N as redirect, C as error } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq, isNull, count } from 'drizzle-orm';
import { d as db, p as persons, h as credentials, m as memberships, g as groups } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { a as audit } from '../../../../chunks/audit.js-DeGbxmfN.js';

function requireInstanceAdmin(user) {
  if (!user) redirect(303, "/login");
  if (!user.isInstanceAdmin) error(403, "Nur für Instanz-Admins.");
  return user;
}
const load = async ({ locals }) => {
  requireInstanceAdmin(locals.user);
  const [persons$1, creds, groups$1] = await Promise.all([
    db.select({
      id: persons.id,
      name: persons.name,
      email: persons.email,
      color: persons.color,
      avatarUrl: persons.avatarUrl,
      isAdmin: persons.isAdmin,
      deactivatedAt: persons.deactivatedAt
    }).from(persons).where(isNull(persons.mergedInto)).orderBy(persons.name),
    db.selectDistinct({ personId: credentials.personId, type: credentials.type }).from(credentials),
    db.select({ personId: memberships.personId, n: count() }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).where(isNull(groups.deletedAt)).groupBy(memberships.personId)
  ]);
  const groupCount = new Map(groups$1.map((g) => [g.personId, g.n]));
  return {
    persons: persons$1.map((p) => {
      const types = creds.filter((c) => c.personId === p.id).map((c) => c.type);
      return {
        ...p,
        deactivatedAt: p.deactivatedAt?.toISOString() ?? null,
        access: types.includes("oidc") ? "Login" : types.includes("passkey") ? "Passkey" : "ohne Zugang",
        groups: groupCount.get(p.id) ?? 0
      };
    })
  };
};
const actions = {
  toggle: async ({ locals, request }) => {
    const user = requireInstanceAdmin(locals.user);
    const f = await request.formData();
    const id = String(f.get("id"));
    const deactivate = f.get("deactivate") === "1";
    if (id === user.id) return fail(400, { message: "Du kannst dich nicht selbst deaktivieren." });
    await db.update(persons).set({ deactivatedAt: deactivate ? /* @__PURE__ */ new Date() : null }).where(and(eq(persons.id, id), isNull(persons.mergedInto)));
    await audit(db, { groupId: null, personId: user.id, action: deactivate ? "person.deactivate" : "person.activate", entityId: id });
    return { ok: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-DaWjUdCI.js.map
