import { C as error } from './utils.js-BjQHIhHk.js';
import { and, eq, isNull, or, asc, inArray, desc } from 'drizzle-orm';
import { c as computePaid, a as computeShares } from './split.js-Diu3SqNm.js';
import { d as db, m as memberships, g as groups, c as categories, k as kassen, p as persons, i as profiles, b as expenses, j as expensePayers, a as attachments, s as settlements } from './index3.js-LeA4cvVT.js';

function computeBalances(members, expenses2, settlements2) {
  const persons2 = /* @__PURE__ */ new Map();
  const person = (id) => {
    let p = persons2.get(id);
    if (!p) persons2.set(id, p = { personId: id, paid: 0, consumed: 0, balance: 0 });
    return p;
  };
  for (const m of members) person(m.personId);
  const errors = [];
  for (const e of expenses2) {
    let paid, shares;
    try {
      paid = computePaid(e);
      shares = computeShares(e, members);
    } catch (err) {
      errors.push({ expenseId: e.id, message: err.message });
      continue;
    }
    for (const [id, v] of paid) person(id).paid += v;
    for (const [id, v] of shares) person(id).consumed += v;
  }
  for (const p of persons2.values()) p.balance = p.paid - p.consumed;
  const kasseOf = new Map(members.map((m) => [m.personId, m.kasseId]));
  const kassen2 = /* @__PURE__ */ new Map();
  const kasse = (id) => {
    let k = kassen2.get(id);
    if (!k)
      kassen2.set(
        id,
        k = {
          kasseId: id,
          personIds: [],
          paid: 0,
          consumed: 0,
          settlementsSent: 0,
          settlementsReceived: 0,
          balance: 0
        }
      );
    return k;
  };
  for (const p of persons2.values()) {
    const k = kasse(kasseOf.get(p.personId) ?? p.personId);
    k.personIds.push(p.personId);
    k.paid += p.paid;
    k.consumed += p.consumed;
  }
  for (const s of settlements2) {
    kasse(s.fromKasseId).settlementsSent += s.amount;
    kasse(s.toKasseId).settlementsReceived += s.amount;
  }
  for (const k of kassen2.values()) {
    k.balance = k.paid - k.consumed + k.settlementsSent - k.settlementsReceived;
  }
  return { persons: persons2, kassen: kassen2, errors };
}
function suggestTransfers(balances) {
  const debtors = [...balances].filter(([, b]) => b < 0).map(([id, b]) => ({ id, amount: -b }));
  const creditors = [...balances].filter(([, b]) => b > 0).map(([id, b]) => ({ id, amount: b }));
  const byAmount = (a, b) => b.amount - a.amount || a.id.localeCompare(b.id);
  const transfers = [];
  debtors.sort(byAmount);
  creditors.sort(byAmount);
  while (debtors.length && creditors.length) {
    const d = debtors[0];
    const c = creditors[0];
    const amount = Math.min(d.amount, c.amount);
    transfers.push({ from: d.id, to: c.id, amount });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount === 0) debtors.shift();
    if (c.amount === 0) creditors.shift();
    debtors.sort(byAmount);
    creditors.sort(byAmount);
  }
  return transfers;
}
function directTransfers(members, expenses2, settlements2) {
  const kasseOf = new Map(members.map((m) => [m.personId, m.kasseId]));
  const k = (id) => kasseOf.get(id) ?? id;
  const net = /* @__PURE__ */ new Map();
  const add = (from, to, amount) => {
    if (from === to || amount === 0) return;
    const key = from < to ? `${from}|${to}` : `${to}|${from}`;
    const sign = from < to ? 1 : -1;
    net.set(key, (net.get(key) ?? 0) + sign * amount);
  };
  for (const e of expenses2) {
    let paid, shares;
    try {
      paid = computePaid(e);
      shares = computeShares(e, members);
    } catch {
      continue;
    }
    const total = [...paid.values()].reduce((s, v) => s + v, 0);
    if (total === 0) continue;
    for (const [consumer, share] of shares) {
      for (const [payer, p] of paid) add(k(consumer), k(payer), Math.round(share * p / total));
    }
  }
  for (const s of settlements2) add(s.toKasseId, s.fromKasseId, s.amount);
  const transfers = [];
  for (const [key, v] of net) {
    const [a, b] = key.split("|");
    if (v > 0) transfers.push({ from: a, to: b, amount: v });
    else if (v < 0) transfers.push({ from: b, to: a, amount: -v });
  }
  return transfers.sort((x, y) => y.amount - x.amount);
}
function consumptionByCategory(members, expenses2) {
  const result = /* @__PURE__ */ new Map();
  for (const { expense, categoryId } of expenses2) {
    let shares;
    try {
      shares = computeShares(expense, members);
    } catch {
      continue;
    }
    const cat = categoryId ?? "";
    for (const [personId, amount] of shares) {
      const m = result.get(personId) ?? /* @__PURE__ */ new Map();
      m.set(cat, (m.get(cat) ?? 0) + amount);
      result.set(personId, m);
    }
  }
  return result;
}
const defaultSettings = {
  simplifyDebts: true,
  editOthers: "all",
  membersCanAddPeople: true
};
function requireUser(user) {
  if (!user) error(401, "Bitte melde dich an.");
  return user;
}
async function requireGroup(groupId, user) {
  const u = requireUser(user);
  const [row] = await db.select({ group: groups, membership: memberships }).from(groups).innerJoin(
    memberships,
    and(eq(memberships.groupId, groups.id), eq(memberships.personId, u.id))
  ).where(and(eq(groups.id, groupId), isNull(groups.deletedAt))).limit(1);
  if (!row) error(404, "Gruppe nicht gefunden.");
  return { ...row, isAdmin: row.membership.role === "admin", user: u };
}
async function requireGroupAdmin(groupId, user) {
  const g = await requireGroup(groupId, user);
  if (!g.isAdmin) error(403, "Nur Gruppenadmins dürfen das.");
  return g;
}
async function loadMembers(groupId) {
  return db.select({
    personId: persons.id,
    name: persons.name,
    color: persons.color,
    avatarUrl: persons.avatarUrl,
    role: memberships.role,
    factor: memberships.factor,
    tags: memberships.tags,
    participationFrom: memberships.participationFrom,
    participationTo: memberships.participationTo,
    kasseId: memberships.kasseId,
    kasseName: kassen.name,
    kassePersonal: kassen.personalOf,
    joinedAt: memberships.joinedAt,
    doneAt: memberships.doneAt,
    doneBy: memberships.doneBy
  }).from(memberships).innerJoin(persons, eq(persons.id, memberships.personId)).innerJoin(kassen, eq(kassen.id, memberships.kasseId)).where(eq(memberships.groupId, groupId)).orderBy(asc(persons.name));
}
async function loadCategories(groupId) {
  return db.select().from(categories).where(or(isNull(categories.groupId), eq(categories.groupId, groupId))).orderBy(asc(categories.sort));
}
async function loadProfiles(groupId) {
  return db.select().from(profiles).where(eq(profiles.groupId, groupId)).orderBy(asc(profiles.sort), asc(profiles.name));
}
async function loadExpenses(groupId, status = "final") {
  const rows = await db.select().from(expenses).where(and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt), eq(expenses.status, status))).orderBy(desc(expenses.date), desc(expenses.createdAt));
  const payers = rows.length ? await db.select().from(expensePayers).where(inArray(expensePayers.expenseId, rows.map((r) => r.id))) : [];
  const files = rows.length ? await db.select({
    id: attachments.id,
    expenseId: attachments.expenseId,
    mime: attachments.mime,
    ocrResult: attachments.ocrResult
  }).from(attachments).where(inArray(attachments.expenseId, rows.map((r) => r.id))) : [];
  return rows.map((r) => ({
    ...r,
    payers: payers.filter((p) => p.expenseId === r.id),
    attachments: files.filter((f) => f.expenseId === r.id).map((f) => ({ id: f.id, mime: f.mime, ocr: f.ocrResult }))
  }));
}
async function loadSettlements(groupId) {
  return db.select().from(settlements).where(and(eq(settlements.groupId, groupId), isNull(settlements.deletedAt))).orderBy(desc(settlements.date), desc(settlements.createdAt));
}
function toCoreMember(m) {
  return {
    personId: m.personId,
    factor: m.factor,
    tags: m.tags,
    from: m.participationFrom ?? void 0,
    to: m.participationTo ?? void 0,
    kasseId: m.kasseId
  };
}
const fallbackRule = { type: "all" };
function toCoreExpense(e, profiles2) {
  const sign = e.type === "income" ? -1 : 1;
  let rule = e.rule ?? profiles2.find((p) => p.id === e.profileId)?.rule ?? fallbackRule;
  if (rule.type === "individual" && rule.mode === "amounts") rule = { ...rule, mode: "shares" };
  return {
    id: e.id,
    date: e.date,
    baseAmount: sign * e.baseAmount,
    privateAmount: sign * e.privateAmount,
    payers: e.payers.map((p) => ({ personId: p.personId, amount: p.amount })),
    rule,
    period: e.periodFrom && e.periodTo && e.periodUnit ? { from: e.periodFrom, to: e.periodTo, unit: e.periodUnit } : void 0,
    frozenShares: e.frozenShares ?? void 0
  };
}
async function loadGroupState(groupId) {
  const [[group], members, expenses2, settlements2, profiles2] = await Promise.all([
    db.select().from(groups).where(eq(groups.id, groupId)),
    loadMembers(groupId),
    loadExpenses(groupId),
    loadSettlements(groupId),
    loadProfiles(groupId)
  ]);
  const coreMembers = members.map(toCoreMember);
  const coreExpenses = expenses2.map((e) => toCoreExpense(e, profiles2));
  const coreSettlements = settlements2.map((s) => ({
    fromKasseId: s.fromKasseId,
    toKasseId: s.toKasseId,
    amount: s.amount
  }));
  const balances = computeBalances(coreMembers, coreExpenses, coreSettlements);
  const transfers = group.settings.simplifyDebts ? suggestTransfers(new Map([...balances.kassen].map(([id, k]) => [id, k.balance]))) : directTransfers(coreMembers, coreExpenses, coreSettlements);
  const kasseIds = [.../* @__PURE__ */ new Set([...balances.kassen.keys(), ...settlements2.flatMap((s) => [s.fromKasseId, s.toKasseId])])];
  const kassenRows = kasseIds.length ? await db.select().from(kassen).where(inArray(kassen.id, kasseIds)) : [];
  return {
    group,
    members,
    expenses: expenses2,
    settlements: settlements2,
    profiles: profiles2,
    coreMembers,
    coreExpenses,
    balances,
    transfers,
    kassen: kassenRows
  };
}
function canEditExpense(g, userId, expense) {
  return g.isAdmin || g.group.settings.editOthers === "all" || expense.createdBy === userId;
}

export { loadExpenses as a, loadProfiles as b, toCoreExpense as c, loadGroupState as d, loadCategories as e, canEditExpense as f, consumptionByCategory as g, requireGroupAdmin as h, defaultSettings as i, loadMembers as l, requireGroup as r, toCoreMember as t };
//# sourceMappingURL=groups.js-By2r4Rg8.js.map
