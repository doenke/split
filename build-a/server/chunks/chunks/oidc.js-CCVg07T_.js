import * as client from 'openid-client';
import { and, eq } from 'drizzle-orm';
import { c as config } from './config.js-oO6Fsv50.js';
import { d as db, h as credentials, p as persons } from './index3.js-LeA4cvVT.js';
import { a as createPerson } from './persons.js-DwTcpoqM.js';

let configPromise = null;
function oidcConfig() {
  if (!config.oidc.enabled) throw new Error("OIDC ist nicht konfiguriert.");
  configPromise ??= client.discovery(new URL(config.oidc.issuer), config.oidc.clientId, config.oidc.clientSecret).catch((e) => {
    configPromise = null;
    throw e;
  });
  return configPromise;
}
const redirectUri = () => `${config.publicUrl}/auth/oidc/callback`;
async function buildLoginUrl() {
  const cfg = await oidcConfig();
  const verifier = client.randomPKCECodeVerifier();
  const state = client.randomState();
  const url = client.buildAuthorizationUrl(cfg, {
    redirect_uri: redirectUri(),
    scope: config.oidc.scopes,
    code_challenge: await client.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
    state
  });
  return { url, verifier, state };
}
async function handleCallback(currentUrl, verifier, state) {
  const cfg = await oidcConfig();
  const callbackUrl = new URL(redirectUri());
  callbackUrl.search = currentUrl.search;
  const tokens = await client.authorizationCodeGrant(cfg, callbackUrl, {
    pkceCodeVerifier: verifier,
    expectedState: state
  });
  const claims = tokens.claims();
  if (!claims) throw new Error("Keine ID-Token-Claims erhalten.");
  let info = { ...claims };
  try {
    info = { ...info, ...await client.fetchUserInfo(cfg, tokens.access_token, claims.sub) };
  } catch {
  }
  const str = (v) => typeof v === "string" && v ? v : null;
  const groups = Array.isArray(info.groups) ? info.groups.filter((g) => typeof g === "string") : [];
  return {
    sub: claims.sub,
    name: str(info.name) ?? str(info.preferred_username) ?? str(info.email) ?? "Unbekannt",
    email: str(info.email),
    picture: str(info.picture),
    groups
  };
}
async function upsertOidcPerson(profile, linkToPersonId) {
  const isAdmin = Boolean(config.oidc.adminGroup && profile.groups.includes(config.oidc.adminGroup));
  const [cred] = await db.select().from(credentials).where(and(eq(credentials.type, "oidc"), eq(credentials.subject, profile.sub))).limit(1);
  let personId = cred?.personId;
  if (!personId) {
    personId = linkToPersonId ?? await createPerson(db, { name: profile.name, email: profile.email });
    await db.insert(credentials).values({
      id: crypto.randomUUID(),
      personId,
      type: "oidc",
      subject: profile.sub
    });
  }
  await db.update(persons).set({ name: profile.name, email: profile.email, avatarUrl: profile.picture, isAdmin }).where(eq(persons.id, personId));
  await db.update(credentials).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(and(eq(credentials.type, "oidc"), eq(credentials.subject, profile.sub)));
  return personId;
}

export { buildLoginUrl as b, handleCallback as h, upsertOidcPerson as u };
//# sourceMappingURL=oidc.js-CCVg07T_.js.map
