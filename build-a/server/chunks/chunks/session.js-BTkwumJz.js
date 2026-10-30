import { eq, and, gt } from 'drizzle-orm';
import { d as db, p as persons, f as sessions, h as credentials } from './index3.js-LeA4cvVT.js';
import { h as hashToken, a as newToken } from './ids.js-2U6-pnrm.js';
import { c as config } from './config.js-oO6Fsv50.js';

const SESSION_COOKIE = "split_session";
const SESSION_DAYS = 365;
async function createSession(cookies, personId, isOidc) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(sessions).values({ id: hashToken(token), personId, isOidc, expiresAt });
  cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: config.secureCookies,
    expires: expiresAt
  });
}
async function validateSession(token) {
  if (!token) return null;
  const id = hashToken(token);
  const rows = await db.select({ session: sessions, person: persons }).from(sessions).innerJoin(persons, eq(persons.id, sessions.personId)).where(and(eq(sessions.id, id), gt(sessions.expiresAt, /* @__PURE__ */ new Date()))).limit(1);
  const row = rows[0];
  if (!row) return null;
  const { person, session } = row;
  if (person.mergedInto) {
    await db.update(sessions).set({ personId: person.mergedInto }).where(eq(sessions.id, id));
    return validateSession(token);
  }
  return { sessionId: id, user: await toSessionUser(person, session.isOidc) };
}
async function toSessionUser(person, oidcSession = false) {
  const oidc = await db.select({ id: credentials.id }).from(credentials).where(and(eq(credentials.personId, person.id), eq(credentials.type, "oidc"))).limit(1);
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    avatarUrl: person.avatarUrl,
    color: person.color,
    isOidc: oidcSession || oidc.length > 0,
    isInstanceAdmin: person.isAdmin
  };
}
async function destroySession(cookies, sessionId) {
  if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export { SESSION_COOKIE as S, createSession as c, destroySession as d, toSessionUser as t, validateSession as v };
//# sourceMappingURL=session.js-BTkwumJz.js.map
