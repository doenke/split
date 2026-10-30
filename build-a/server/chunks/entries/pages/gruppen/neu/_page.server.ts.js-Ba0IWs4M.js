import { C as error, O as fail, N as redirect } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { eq, and, isNull } from 'drizzle-orm';
import { d as db, g as groups, m as memberships, i as profiles } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { c as config } from '../../../../chunks/config.js-oO6Fsv50.js';
import { i as defaultSettings, l as loadMembers, b as loadProfiles } from '../../../../chunks/groups.js-By2r4Rg8.js';
import { n as newId } from '../../../../chunks/ids.js-2U6-pnrm.js';
import { p as personalKasseId } from '../../../../chunks/persons.js-DwTcpoqM.js';
import { a as audit } from '../../../../chunks/audit.js-DeGbxmfN.js';
import { k as knownCurrencies, c as commonCurrencies } from '../../../../chunks/rates.js-C_LWDk2B.js';

async function myGroups(userId) {
  return db.select({ id: groups.id, name: groups.name, emoji: groups.emoji, currency: groups.baseCurrency }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).where(and(eq(memberships.personId, userId), isNull(groups.deletedAt))).orderBy(groups.name);
}
const load = async ({ locals, url }) => {
  if (!locals.user) redirect(303, "/login");
  if (!locals.user.isOidc) error(403, "Nur Nutzer mit Login dürfen Gruppen anlegen.");
  const known = await knownCurrencies();
  return {
    currencies: [.../* @__PURE__ */ new Set([...commonCurrencies, ...known])],
    defaultCurrency: config.defaultCurrency,
    templates: await myGroups(locals.user.id),
    templateId: url.searchParams.get("vorlage")
  };
};
const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user?.isOidc) error(403);
    const f = await request.formData();
    const name = String(f.get("name") ?? "").trim();
    const emoji = String(f.get("emoji") ?? "").trim() || "🧳";
    const currency = String(f.get("currency") ?? "EUR");
    const startDate = String(f.get("startDate") ?? "") || null;
    const endDate = String(f.get("endDate") ?? "") || null;
    if (!name) return fail(400, { message: "Bitte gib einen Namen an." });
    if (!/^[A-Z]{3}$/.test(currency)) return fail(400, { message: "Ungültige Währung." });
    const userId = locals.user.id;
    const templateId = String(f.get("template") ?? "");
    let template = null;
    if (templateId) {
      template = (await myGroups(userId)).find((g) => g.id === templateId);
      if (!template) return fail(400, { message: "Vorlage nicht gefunden." });
    }
    const copyPeople = template && f.get("copyPeople") === "on";
    const copyProfiles = template && f.get("copyProfiles") === "on";
    const [templateRow] = template ? await db.select().from(groups).where(eq(groups.id, template.id)) : [];
    const id = newId(10);
    await db.transaction(async (tx) => {
      await tx.insert(groups).values({
        id,
        name,
        emoji,
        baseCurrency: currency,
        startDate,
        endDate,
        settings: templateRow?.settings ?? defaultSettings,
        templateOf: template?.id ?? null,
        createdBy: userId
      });
      const members = copyPeople ? await loadMembers(template.id) : [];
      const me = members.find((m) => m.personId === userId);
      await tx.insert(memberships).values({
        groupId: id,
        personId: userId,
        role: "admin",
        factor: me?.factor ?? 1,
        tags: me?.tags ?? [],
        kasseId: me?.kasseId ?? await personalKasseId(tx, userId)
      });
      for (const m of members) {
        if (m.personId === userId) continue;
        await tx.insert(memberships).values({
          groupId: id,
          personId: m.personId,
          role: m.role,
          factor: m.factor,
          tags: m.tags,
          kasseId: m.kasseId
        });
      }
      if (copyProfiles) {
        const profiles$1 = await loadProfiles(template.id);
        if (profiles$1.length) {
          await tx.insert(profiles).values(
            profiles$1.map((p) => ({ id: newId(), groupId: id, name: p.name, icon: p.icon, rule: p.rule, defaultCategoryId: p.defaultCategoryId, sort: p.sort }))
          );
        }
      }
      await audit(tx, { groupId: id, personId: userId, action: "group.create", entityId: id, data: template ? { template: template.name } : void 0 });
    });
    redirect(303, copyPeople ? `/gruppen/${id}` : `/gruppen/${id}/mitglieder?neu=1`);
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-Ba0IWs4M.js.map
