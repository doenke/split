import { C as error } from './utils.js-BjQHIhHk.js';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { d as db, n as kasseMembers, k as kassen, p as persons, m as memberships, g as groups, s as settlements } from './index3.js-LeA4cvVT.js';
import { d as loadGroupState } from './groups.js-By2r4Rg8.js';

async function sharedKassenOf(personId) {
  return db.select({
    id: kassen.id,
    name: kassen.name,
    isManager: kasseMembers.isManager,
    isPreferred: kasseMembers.isPreferred
  }).from(kasseMembers).innerJoin(kassen, eq(kassen.id, kasseMembers.kasseId)).where(and(eq(kasseMembers.personId, personId), isNull(kassen.personalOf))).orderBy(kassen.name);
}
async function accessibleKassenOf(personId) {
  const own = (await sharedKassenOf(personId)).map((k) => ({ ...k, isMember: true }));
  const created = await db.select({ id: kassen.id, name: kassen.name }).from(kassen).where(and(eq(kassen.createdBy, personId), isNull(kassen.personalOf)));
  const ids = new Set(own.map((k) => k.id));
  const forOthers = created.filter((k) => !ids.has(k.id)).map((k) => ({ ...k, isManager: true, isPreferred: false, isMember: false }));
  return [...own, ...forOthers].sort((a, b) => a.name.localeCompare(b.name, "de"));
}
async function kasseMembersOf(kasseId) {
  return db.select({
    personId: persons.id,
    name: persons.name,
    color: persons.color,
    avatarUrl: persons.avatarUrl,
    isManager: kasseMembers.isManager,
    isPreferred: kasseMembers.isPreferred
  }).from(kasseMembers).innerJoin(persons, eq(persons.id, kasseMembers.personId)).where(eq(kasseMembers.kasseId, kasseId)).orderBy(persons.name);
}
async function requireKasse(kasseId, user) {
  if (!user) error(401, "Bitte melde dich an.");
  const [kasse] = await db.select().from(kassen).where(eq(kassen.id, kasseId));
  if (!kasse || kasse.personalOf) error(404, "Kasse nicht gefunden.");
  const members = await kasseMembersOf(kasseId);
  const me = members.find((m) => m.personId === user.id);
  const creator = kasse.createdBy === user.id;
  if (!me && !creator) error(404, "Kasse nicht gefunden.");
  return { kasse, members, isManager: me ? me.isManager : creator, isMember: !!me, user };
}
async function pickKasseForGroup(personId, groupId, personalKasseId) {
  const shared = await sharedKassenOf(personId);
  if (!shared.length) return personalKasseId;
  const used = await db.selectDistinct({ kasseId: memberships.kasseId }).from(memberships).where(
    and(
      eq(memberships.groupId, groupId),
      inArray(
        memberships.kasseId,
        shared.map((k) => k.id)
      )
    )
  );
  if (used.length) return used[0].kasseId;
  return (shared.find((k) => k.isPreferred) ?? (shared.length === 1 ? shared[0] : null))?.id ?? personalKasseId;
}
async function kasseOverview(kasseId) {
  const groupRows = await db.selectDistinct({ groupId: memberships.groupId }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).where(and(eq(memberships.kasseId, kasseId), isNull(groups.deletedAt)));
  const groups$1 = [];
  const net = /* @__PURE__ */ new Map();
  const kasseNames = /* @__PURE__ */ new Map();
  for (const { groupId } of groupRows) {
    const state = await loadGroupState(groupId);
    for (const k of state.kassen) kasseNames.set(k.id, k.name);
    const balance = state.balances.kassen.get(kasseId);
    const transfers = state.transfers.filter((t) => t.from === kasseId || t.to === kasseId);
    groups$1.push({
      id: groupId,
      name: state.group.name,
      emoji: state.group.emoji,
      currency: state.group.baseCurrency,
      status: state.group.status,
      paid: balance?.paid ?? 0,
      consumed: balance?.consumed ?? 0,
      balance: balance?.balance ?? 0,
      transfers
    });
    for (const t of transfers) {
      const other = t.from === kasseId ? t.to : t.from;
      const signed = t.to === kasseId ? t.amount : -t.amount;
      const key = `${other}|${state.group.baseCurrency}`;
      const entry = net.get(key) ?? { kasseId: other, currency: state.group.baseCurrency, amount: 0, parts: [] };
      entry.amount += signed;
      entry.parts.push({ groupId, amount: signed });
      net.set(key, entry);
    }
  }
  const totals = /* @__PURE__ */ new Map();
  for (const g of groups$1) totals.set(g.currency, (totals.get(g.currency) ?? 0) + g.balance);
  return {
    groups: groups$1,
    totals: [...totals].map(([currency, amount]) => ({ currency, amount })),
    // only interesting when a counterparty appears in more than one group
    netting: [...net.values()].filter((n) => n.parts.length > 1).map((n) => ({ ...n, name: kasseNames.get(n.kasseId) ?? "?" })),
    kasseNames: Object.fromEntries(kasseNames)
  };
}
async function syncKasseToGroups(kasseId, onlyGroupId) {
  const [kasse] = await db.select().from(kassen).where(eq(kassen.id, kasseId));
  if (!kasse || kasse.personalOf) return [];
  const members = await kasseMembersOf(kasseId);
  if (members.length < 2) return [];
  const rows = await db.select({
    groupId: memberships.groupId,
    groupName: groups.name,
    personId: memberships.personId,
    kasseId: memberships.kasseId,
    personalOf: kassen.personalOf
  }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).innerJoin(kassen, eq(kassen.id, memberships.kasseId)).where(
    and(
      inArray(memberships.personId, members.map((m) => m.personId)),
      eq(groups.status, "active"),
      isNull(groups.deletedAt),
      onlyGroupId ? eq(memberships.groupId, onlyGroupId) : void 0
    )
  );
  const byGroup = /* @__PURE__ */ new Map();
  for (const r of rows) byGroup.set(r.groupId, [...byGroup.get(r.groupId) ?? [], r]);
  const names = new Map(members.map((m) => [m.personId, m.name]));
  const result = [];
  for (const [groupId, list] of byGroup) {
    if (list.length < 2) continue;
    const candidates = list.filter((r) => r.kasseId !== kasseId && r.personalOf === r.personId);
    if (!candidates.length) continue;
    const paid = await db.selectDistinct({ from: settlements.fromKasseId, to: settlements.toKasseId }).from(settlements).where(and(eq(settlements.groupId, groupId), isNull(settlements.deletedAt)));
    const withPayments = new Set(paid.flatMap((p) => [p.from, p.to]));
    const switching = candidates.filter((r) => !withPayments.has(r.kasseId));
    if (!switching.length) continue;
    await db.update(memberships).set({ kasseId }).where(and(eq(memberships.groupId, groupId), inArray(memberships.personId, switching.map((r) => r.personId))));
    result.push({ groupId, groupName: list[0].groupName, kasseName: kasse.name, names: switching.map((r) => names.get(r.personId) ?? "?") });
  }
  return result;
}
async function syncPersonKassen(personId, onlyGroupId) {
  const result = [];
  for (const k of await sharedKassenOf(personId)) result.push(...await syncKasseToGroups(k.id, onlyGroupId));
  return result;
}

export { accessibleKassenOf as a, syncKasseToGroups as b, syncPersonKassen as c, kasseOverview as d, kasseMembersOf as k, pickKasseForGroup as p, requireKasse as r, sharedKassenOf as s };
//# sourceMappingURL=kassen.js-CLUnyc1X.js.map
