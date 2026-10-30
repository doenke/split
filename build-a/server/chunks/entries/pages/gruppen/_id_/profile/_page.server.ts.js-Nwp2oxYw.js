import { C as error, O as fail } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq, isNull } from 'drizzle-orm';
import { d as db, i as profiles, b as expenses } from '../../../../../chunks/index3.js-LeA4cvVT.js';
import { h as requireGroupAdmin, l as loadMembers } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { n as newId } from '../../../../../chunks/ids.js-2U6-pnrm.js';
import { a as audit } from '../../../../../chunks/audit.js-DeGbxmfN.js';

function ruleFromForm(f, memberIds) {
  const num = (v) => {
    const n = parseFloat(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  };
  if (f.get("mode") === "persons") {
    const included = f.getAll("person").map(String).filter((id) => memberIds.includes(id));
    const persons = {};
    for (const id of included) {
      const n = num(f.get(`factor_${id}`));
      if (n !== null) persons[id] = n;
    }
    const rule2 = { type: "only", included };
    if (Object.keys(persons).length) rule2.factorOverrides = { persons };
    return rule2;
  }
  const list = (key) => [...new Set(String(f.get(key) ?? "").split(",").map((t) => t.trim()).filter(Boolean))];
  const require2 = list("require");
  const exclude = list("exclude");
  const tags = {};
  const names = f.getAll("overrideTag").map(String);
  const values = f.getAll("overrideFactor").map(String);
  names.forEach((t, i) => {
    const n = parseFloat((values[i] ?? "").replace(",", "."));
    if (t.trim() && Number.isFinite(n) && n >= 0) tags[t.trim()] = n;
  });
  const rule = { type: "all" };
  if (require2.length || exclude.length) {
    rule.tagFilter = {};
    if (require2.length) rule.tagFilter.require = require2;
    if (exclude.length) rule.tagFilter.exclude = exclude;
  }
  if (Object.keys(tags).length) rule.factorOverrides = { tags };
  return rule;
}
const actions = {
  save: async ({ params, locals, request }) => {
    const g = await requireGroupAdmin(params.id, locals.user);
    const f = await request.formData();
    const name = String(f.get("name") ?? "").trim();
    if (!name) return fail(400, { message: "Bitte einen Namen angeben." });
    const values = {
      name,
      icon: String(f.get("icon") ?? "").trim() || "🏷️",
      rule: ruleFromForm(f, (await loadMembers(params.id)).map((m) => m.personId)),
      defaultCategoryId: String(f.get("defaultCategoryId") ?? "") || null
    };
    const id = String(f.get("id") ?? "");
    if (id) {
      const res = await db.update(profiles).set(values).where(and(eq(profiles.id, id), eq(profiles.groupId, params.id))).returning({ id: profiles.id });
      if (!res.length) error(404);
    } else {
      await db.insert(profiles).values({ id: newId(), groupId: params.id, sort: 99, ...values });
    }
    await audit(db, { groupId: params.id, personId: g.user.id, action: "profile.save", entityId: id || void 0, data: { title: name } });
    return { saved: true };
  },
  delete: async ({ params, locals, request }) => {
    const g = await requireGroupAdmin(params.id, locals.user);
    const id = String((await request.formData()).get("id"));
    const [p] = await db.select().from(profiles).where(and(eq(profiles.id, id), eq(profiles.groupId, params.id)));
    if (!p) error(404);
    await db.update(expenses).set({ rule: p.rule }).where(and(eq(expenses.profileId, id), eq(expenses.groupId, params.id), isNull(expenses.rule)));
    await db.update(expenses).set({ profileId: null }).where(and(eq(expenses.profileId, id), eq(expenses.groupId, params.id)));
    await db.delete(profiles).where(eq(profiles.id, id));
    await audit(db, { groupId: params.id, personId: g.user.id, action: "profile.delete", entityId: id, data: { title: p.name } });
    return { deleted: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-Nwp2oxYw.js.map
