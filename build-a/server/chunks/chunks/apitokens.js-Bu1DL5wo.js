import { eq, and, desc } from 'drizzle-orm';
import { d as db, p as persons, v as apiTokens } from './index3.js-LeA4cvVT.js';
import { h as hashToken, a as newToken } from './ids.js-2U6-pnrm.js';
import { t as toSessionUser } from './session.js-BTkwumJz.js';

const PREFIX = "split_";
async function createApiToken(personId, label) {
  const token = PREFIX + newToken();
  await db.insert(apiTokens).values({ id: hashToken(token), personId, label: label.slice(0, 60) || "KI-Assistent" });
  return token;
}
async function listApiTokens(personId) {
  return db.select({ id: apiTokens.id, label: apiTokens.label, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt }).from(apiTokens).where(eq(apiTokens.personId, personId)).orderBy(desc(apiTokens.createdAt));
}
async function revokeApiToken(personId, id) {
  await db.delete(apiTokens).where(and(eq(apiTokens.id, id), eq(apiTokens.personId, personId)));
}
async function userForApiToken(token) {
  if (!token.startsWith(PREFIX)) return null;
  const id = hashToken(token);
  const [row] = await db.select({ person: persons }).from(apiTokens).innerJoin(persons, eq(persons.id, apiTokens.personId)).where(eq(apiTokens.id, id));
  if (!row) return null;
  const person = row.person;
  if (person.mergedInto) {
    await db.update(apiTokens).set({ personId: person.mergedInto }).where(eq(apiTokens.id, id));
    return userForApiToken(token);
  }
  void db.update(apiTokens).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(apiTokens.id, id)).catch(() => {
  });
  return toSessionUser(person);
}

export { createApiToken as c, listApiTokens as l, revokeApiToken as r, userForApiToken as u };
//# sourceMappingURL=apitokens.js-Bu1DL5wo.js.map
