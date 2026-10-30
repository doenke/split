import { O as fail, N as redirect, C as error } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { eq, or, and } from 'drizzle-orm';
import { d as db, m as memberships, s as settlements, k as kassen, n as kasseMembers, c as categories } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { n as newId } from '../../../../chunks/ids.js-2U6-pnrm.js';
import { a as audit } from '../../../../chunks/audit.js-DeGbxmfN.js';
import { p as personalKasseId, n as nameFromForm, k as knownPersons, s as sameName, a as createPerson } from '../../../../chunks/persons.js-DwTcpoqM.js';
import { r as requireKasse, d as kasseOverview, b as syncKasseToGroups } from '../../../../chunks/kassen.js-CLUnyc1X.js';
import { g as groupCosts } from '../../../../chunks/costs.js-Dz_Hp_RZ.js';
import { d as defaultCategories } from '../../../../chunks/defaults.js-BfACFTys.js';
import { t as today } from '../../../../chunks/format.js-Cn5c-OM3.js';

const load = async ({ params, locals }) => {
  const k = await requireKasse(params.id, locals.user);
  const ids = new Set(k.members.map((m) => m.personId));
  const [overview, known] = await Promise.all([kasseOverview(params.id), knownPersons(k.user.id)]);
  const costs = await Promise.all(
    overview.groups.map(async (g) => {
      const c = await groupCosts(g.id);
      const year = (c.group.startDate ?? c.group.createdAt.toISOString()).slice(0, 4);
      return { groupId: g.id, year, currency: g.currency, totals: c.kassen[params.id] ?? {} };
    })
  );
  const categories$1 = await db.select().from(categories);
  return {
    costs,
    categories: categories$1.length ? categories$1 : defaultCategories,
    kasse: k.kasse,
    members: k.members,
    isManager: k.isManager,
    known: known.filter((p) => !ids.has(p.id)),
    ...overview
  };
};
async function requireManager(id, user) {
  const k = await requireKasse(id, user);
  if (!k.isManager) error(403, "Nur Verwalter der Kasse dürfen das.");
  return k;
}
const actions = {
  rename: async ({ params, locals, request }) => {
    await requireManager(params.id, locals.user);
    const name = String((await request.formData()).get("name") ?? "").trim();
    if (!name) return fail(400, { message: "Name fehlt." });
    await db.update(kassen).set({ name }).where(eq(kassen.id, params.id));
    return { saved: true };
  },
  addMember: async ({ params, locals, request }) => {
    const k = await requireManager(params.id, locals.user);
    const f = await request.formData();
    const existingId = String(f.get("personId") ?? "");
    const name = nameFromForm(f);
    let personId;
    if (existingId) {
      const known = await knownPersons(k.user.id);
      if (!known.some((p) => p.id === existingId)) return fail(400, { message: "Unbekannte Person." });
      personId = existingId;
    } else {
      if (!name) return fail(400, { message: "Bitte einen Vornamen angeben." });
      const twin = sameName(name, [...k.members, ...await knownPersons(k.user.id)]);
      if (twin) return fail(400, { message: `„${twin.name}“ gibt es schon. Wähle die Person unter „Bekannte Person“ oder ergänze den Nachnamen.` });
      personId = await createPerson(db, { name, createdBy: k.user.id });
    }
    if (k.members.some((m) => m.personId === personId)) return fail(400, { message: "Schon Mitglied." });
    const first = k.members.length === 0;
    await db.insert(kasseMembers).values({ kasseId: params.id, personId, isManager: first });
    if (!k.kasse.receiverPersonId) await db.update(kassen).set({ receiverPersonId: personId }).where(eq(kassen.id, params.id));
    const switched = await syncKasseToGroups(params.id);
    return { added: true, switched };
  },
  removeMember: async ({ params, locals, request }) => {
    const personId = String((await request.formData()).get("personId"));
    const k = await requireKasse(params.id, locals.user);
    const self = personId === k.user.id;
    if (!self && !k.isManager) error(403);
    const target = k.members.find((m) => m.personId === personId);
    if (!target) error(404);
    const managersLeft = k.members.filter((m) => m.isManager && m.personId !== personId);
    if (target.isManager && managersLeft.length === 0 && k.members.length > 1) {
      return fail(400, { message: "Ernenne zuerst einen anderen Verwalter." });
    }
    const personal = await personalKasseId(db, personId);
    await db.update(memberships).set({ kasseId: personal }).where(and(eq(memberships.personId, personId), eq(memberships.kasseId, params.id)));
    await db.delete(kasseMembers).where(and(eq(kasseMembers.kasseId, params.id), eq(kasseMembers.personId, personId)));
    if (k.kasse.receiverPersonId === personId) {
      await db.update(kassen).set({ receiverPersonId: managersLeft[0]?.personId ?? null }).where(eq(kassen.id, params.id));
    }
    if (self) redirect(303, "/kassen");
    return { removed: true };
  },
  toggleManager: async ({ params, locals, request }) => {
    const k = await requireManager(params.id, locals.user);
    const personId = String((await request.formData()).get("personId"));
    const target = k.members.find((m) => m.personId === personId);
    if (!target) error(404);
    if (target.isManager && k.members.filter((m) => m.isManager).length <= 1) {
      return fail(400, { message: "Die Kasse braucht mindestens einen Verwalter." });
    }
    await db.update(kasseMembers).set({ isManager: !target.isManager }).where(and(eq(kasseMembers.kasseId, params.id), eq(kasseMembers.personId, personId)));
    return { saved: true };
  },
  setPreferred: async ({ params, locals }) => {
    const k = await requireKasse(params.id, locals.user);
    const me = k.members.find((m) => m.personId === k.user.id);
    await db.update(kasseMembers).set({ isPreferred: false }).where(eq(kasseMembers.personId, k.user.id));
    if (!me.isPreferred) {
      await db.update(kasseMembers).set({ isPreferred: true }).where(and(eq(kasseMembers.kasseId, params.id), eq(kasseMembers.personId, k.user.id)));
    }
    return { saved: true };
  },
  setReceiver: async ({ params, locals, request }) => {
    const k = await requireManager(params.id, locals.user);
    const personId = String((await request.formData()).get("personId"));
    if (!k.members.some((m) => m.personId === personId)) error(404);
    await db.update(kassen).set({ receiverPersonId: personId }).where(eq(kassen.id, params.id));
    return { saved: true };
  },
  /** Records one netted payment as linked settlements in every involved group. */
  settleNet: async ({ params, locals, request }) => {
    const k = await requireKasse(params.id, locals.user);
    const f = await request.formData();
    const other = String(f.get("kasseId"));
    const currency = String(f.get("currency"));
    const method = ["cash", "transfer", "paypal", "wero", "other"].find((m) => m === f.get("method")) ?? "other";
    const overview = await kasseOverview(params.id);
    const entry = overview.netting.find((n) => n.kasseId === other && n.currency === currency);
    if (!entry) return fail(400, { message: "Die Verrechnung ist nicht mehr aktuell. Bitte neu laden." });
    const linkId = newId();
    const confirmed = entry.amount > 0;
    await db.transaction(async (tx) => {
      for (const part of entry.parts) {
        const id = newId();
        await tx.insert(settlements).values({
          id,
          groupId: part.groupId,
          fromKasseId: part.amount > 0 ? other : params.id,
          toKasseId: part.amount > 0 ? params.id : other,
          amount: Math.abs(part.amount),
          method,
          status: confirmed ? "confirmed" : "pending",
          confirmedAt: confirmed ? /* @__PURE__ */ new Date() : null,
          linkId,
          date: today(),
          createdBy: k.user.id
        });
        await audit(tx, { groupId: part.groupId, personId: k.user.id, action: "settlement.create", entityId: id, data: { linkId } });
      }
    });
    return { settled: true };
  },
  delete: async ({ params, locals }) => {
    await requireManager(params.id, locals.user);
    const used = await db.select({ g: memberships.groupId }).from(memberships).where(eq(memberships.kasseId, params.id)).limit(1);
    const settled = await db.select({ id: settlements.id }).from(settlements).where(or(eq(settlements.fromKasseId, params.id), eq(settlements.toKasseId, params.id))).limit(1);
    if (used.length || settled.length) {
      return fail(400, { message: "Die Kasse wird noch in Gruppen verwendet und kann nicht gelöscht werden." });
    }
    await db.delete(kassen).where(eq(kassen.id, params.id));
    redirect(303, "/kassen");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-BmH4pq-d.js.map
