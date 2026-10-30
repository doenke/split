import { generateAuthenticationOptions, verifyAuthenticationResponse, generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { and, eq } from 'drizzle-orm';
import { c as config } from './config.js-oO6Fsv50.js';
import { d as db, h as credentials } from './index3.js-LeA4cvVT.js';
import { n as newId } from './ids.js-2U6-pnrm.js';

const CHALLENGE_COOKIE = "split_webauthn";
function storeChallenge(cookies, challenge) {
  cookies.set(CHALLENGE_COOKIE, challenge, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: config.secureCookies,
    maxAge: 300
  });
}
function takeChallenge(cookies) {
  const c = cookies.get(CHALLENGE_COOKIE);
  cookies.delete(CHALLENGE_COOKIE, { path: "/" });
  if (!c) throw new Error("Die Anfrage ist abgelaufen. Bitte erneut versuchen.");
  return c;
}
async function passkeysOf(personId) {
  return db.select().from(credentials).where(and(eq(credentials.personId, personId), eq(credentials.type, "passkey")));
}
async function registrationOptions(cookies, person) {
  const existing = await passkeysOf(person.id);
  const options = await generateRegistrationOptions({
    rpName: config.webauthn.rpName,
    rpID: config.webauthn.rpId,
    userName: person.name,
    userDisplayName: person.name,
    userID: new TextEncoder().encode(person.id),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.subject,
      transports: c.transports?.split(",") ?? []
    })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" }
  });
  storeChallenge(cookies, options.challenge);
  return options;
}
async function verifyRegistration(cookies, personId, response, label) {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: takeChallenge(cookies),
    expectedOrigin: config.webauthn.origin,
    expectedRPID: config.webauthn.rpId
  });
  if (!verification.verified || !verification.registrationInfo) throw new Error("Passkey konnte nicht geprüft werden.");
  const { credential } = verification.registrationInfo;
  await db.insert(credentials).values({
    id: newId(),
    personId,
    type: "passkey",
    subject: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports?.join(",") ?? null,
    label
  });
}
async function authenticationOptions(cookies) {
  const options = await generateAuthenticationOptions({
    rpID: config.webauthn.rpId,
    userVerification: "preferred"
  });
  storeChallenge(cookies, options.challenge);
  return options;
}
async function verifyAuthentication(cookies, response) {
  const expectedChallenge = takeChallenge(cookies);
  const [cred] = await db.select().from(credentials).where(and(eq(credentials.type, "passkey"), eq(credentials.subject, response.id))).limit(1);
  if (!cred || !cred.publicKey) throw new Error("Dieser Passkey ist nicht (mehr) bekannt.");
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: config.webauthn.origin,
    expectedRPID: config.webauthn.rpId,
    credential: {
      id: cred.subject,
      publicKey: new Uint8Array(Buffer.from(cred.publicKey, "base64url")),
      counter: cred.counter ?? 0,
      transports: cred.transports?.split(",") ?? []
    }
  });
  if (!verification.verified) throw new Error("Anmeldung mit Passkey fehlgeschlagen.");
  await db.update(credentials).set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(credentials.id, cred.id));
  return cred.personId;
}

export { authenticationOptions as a, verifyRegistration as b, registrationOptions as r, verifyAuthentication as v };
//# sourceMappingURL=passkey.js-ChAryyAf.js.map
