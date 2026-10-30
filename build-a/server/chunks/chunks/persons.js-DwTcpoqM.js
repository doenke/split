import { eq, and, sql, inArray, isNull } from 'drizzle-orm';
import { p as persons, k as kassen, d as db, m as memberships, j as expensePayers, s as settlements, n as kasseMembers, h as credentials, f as sessions } from './index3.js-LeA4cvVT.js';
import { n as newId } from './ids.js-2U6-pnrm.js';

const colors = ["#e76f51", "#2a9d8f", "#e9c46a", "#264653", "#f4a261", "#8e7dbe", "#5b8e7d", "#d1495b", "#00798c", "#edae49"];
function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}
async function createPerson(tx, data) {
  const id = newId();
  await tx.insert(persons).values({
    id,
    name: data.name,
    email: data.email ?? null,
    avatarUrl: data.avatarUrl ?? null,
    color: randomColor(),
    createdBy: data.createdBy ?? null
  });
  await tx.insert(kassen).values({
    id: newId(),
    name: data.name,
    personalOf: id,
    receiverPersonId: id,
    createdBy: data.createdBy ?? id
  });
  return id;
}
async function personalKasseId(tx, personId) {
  const [k] = await tx.select({ id: kassen.id }).from(kassen).where(eq(kassen.personalOf, personId)).limit(1);
  if (k) return k.id;
  const [p] = await tx.select({ name: persons.name }).from(persons).where(eq(persons.id, personId));
  const id = newId();
  await tx.insert(kassen).values({ id, name: p?.name ?? "?", personalOf: personId, receiverPersonId: personId });
  return id;
}
async function claimedPersonIds(personIds) {
  if (!personIds.length) return /* @__PURE__ */ new Set();
  const creds = await db.selectDistinct({ id: credentials.personId }).from(credentials).where(inArray(credentials.personId, personIds));
  const sessions$1 = await db.selectDistinct({ id: sessions.personId }).from(sessions).where(and(inArray(sessions.personId, personIds), sql`${sessions.expiresAt} > now()`));
  return new Set([...creds, ...sessions$1].map((r) => r.id));
}
async function knownPersons(userId) {
  const cols = { id: persons.id, name: persons.name, color: persons.color, avatarUrl: persons.avatarUrl };
  const myGroups = db.select({ id: memberships.groupId }).from(memberships).where(eq(memberships.personId, userId));
  const myKassen = db.select({ id: kasseMembers.kasseId }).from(kasseMembers).where(eq(kasseMembers.personId, userId));
  const [fromGroups, fromKassen] = await Promise.all([
    db.selectDistinct(cols).from(memberships).innerJoin(persons, eq(persons.id, memberships.personId)).where(and(inArray(memberships.groupId, myGroups), isNull(persons.mergedInto), isNull(persons.deactivatedAt))),
    db.selectDistinct(cols).from(kasseMembers).innerJoin(persons, eq(persons.id, kasseMembers.personId)).where(and(inArray(kasseMembers.kasseId, myKassen), isNull(persons.mergedInto), isNull(persons.deactivatedAt)))
  ]);
  const all = new Map([...fromGroups, ...fromKassen].map((p) => [p.id, p]));
  all.delete(userId);
  return [...all.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
}
async function mergePersons(fromId, intoId) {
  await db.transaction(async (tx) => {
    const fromGroups = await tx.select({ groupId: memberships.groupId, kasseId: memberships.kasseId }).from(memberships).where(eq(memberships.personId, fromId));
    const intoGroups = new Set(
      (await tx.select({ groupId: memberships.groupId }).from(memberships).where(eq(memberships.personId, intoId))).map((r) => r.groupId)
    );
    const conflict = fromGroups.find((g) => intoGroups.has(g.groupId));
    if (conflict) throw new Error("Beide Personen sind bereits Mitglied derselben Gruppe.");
    const fromKasse = await personalKasseId(tx, fromId);
    const intoKasse = await personalKasseId(tx, intoId);
    await tx.update(memberships).set({ personId: intoId }).where(eq(memberships.personId, fromId));
    await tx.update(memberships).set({ kasseId: intoKasse }).where(and(eq(memberships.personId, intoId), eq(memberships.kasseId, fromKasse)));
    await tx.update(expensePayers).set({ personId: intoId }).where(eq(expensePayers.personId, fromId));
    await tx.update(settlements).set({ fromKasseId: intoKasse }).where(eq(settlements.fromKasseId, fromKasse));
    await tx.update(settlements).set({ toKasseId: intoKasse }).where(eq(settlements.toKasseId, fromKasse));
    const intoKassen = new Set(
      (await tx.select({ id: kasseMembers.kasseId }).from(kasseMembers).where(eq(kasseMembers.personId, intoId))).map((r) => r.id)
    );
    const fromKassen = await tx.select().from(kasseMembers).where(eq(kasseMembers.personId, fromId));
    for (const km of fromKassen) {
      if (intoKassen.has(km.kasseId)) continue;
      await tx.insert(kasseMembers).values({ ...km, personId: intoId });
    }
    await tx.delete(kasseMembers).where(eq(kasseMembers.personId, fromId));
    await tx.update(persons).set({ mergedInto: intoId }).where(eq(persons.id, fromId));
    await tx.delete(kassen).where(eq(kassen.id, fromKasse));
    await tx.execute(sql`update expenses set rule = replace(rule::text, ${'"' + fromId + '"'}, ${'"' + intoId + '"'})::jsonb where rule::text like ${"%" + fromId + "%"}`);
    await tx.execute(sql`update profiles set rule = replace(rule::text, ${'"' + fromId + '"'}, ${'"' + intoId + '"'})::jsonb where rule::text like ${"%" + fromId + "%"}`);
  });
}
function nameFromForm(f) {
  const part = (k) => String(f.get(k) ?? "").trim().replace(/\s+/g, " ");
  return [part("firstName"), part("lastName")].filter(Boolean).join(" ").slice(0, 80);
}
const normName = (s) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase("de");
function sameName(name, people) {
  return people.find((p) => normName(p.name) === normName(name));
}

export { createPerson as a, claimedPersonIds as c, knownPersons as k, mergePersons as m, nameFromForm as n, personalKasseId as p, sameName as s };
//# sourceMappingURL=persons.js-DwTcpoqM.js.map
