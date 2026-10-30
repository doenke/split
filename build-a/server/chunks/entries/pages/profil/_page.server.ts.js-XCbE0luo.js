import { N as redirect, O as fail } from '../../../chunks/utils.js-BjQHIhHk.js';
import { eq, and, gt } from 'drizzle-orm';
import { d as db, f as sessions, h as credentials, u as paymentDetails, p as persons, k as kassen } from '../../../chunks/index3.js-LeA4cvVT.js';
import { c as config } from '../../../chunks/config.js-oO6Fsv50.js';
import QRCode from 'qrcode';
import { e as createPairingInvite } from '../../../chunks/invites.js-DxO04p_p.js';
import { r as revokeApiToken, c as createApiToken, l as listApiTokens } from '../../../chunks/apitokens.js-Bu1DL5wo.js';
import { i as isValidIban, n as normalizePaypalMe, a as normalizeIban, f as formatIban } from '../../../chunks/payment.js-CbbaTPu0.js';

const load = async ({ locals }) => {
  if (!locals.user) redirect(303, "/login");
  const creds = await db.select({ id: credentials.id, type: credentials.type, label: credentials.label, createdAt: credentials.createdAt, lastUsedAt: credentials.lastUsedAt }).from(credentials).where(eq(credentials.personId, locals.user.id));
  const sessions$1 = await db.select({ id: sessions.id, createdAt: sessions.createdAt }).from(sessions).where(and(eq(sessions.personId, locals.user.id), gt(sessions.expiresAt, /* @__PURE__ */ new Date())));
  const [payment] = await db.select().from(paymentDetails).where(eq(paymentDetails.personId, locals.user.id));
  return {
    payment: payment ? { ...payment, iban: payment.iban ? formatIban(payment.iban) : null } : null,
    passkeys: creds.filter((c) => c.type === "passkey"),
    hasOidc: creds.some((c) => c.type === "oidc"),
    sessionCount: sessions$1.length,
    oidcEnabled: config.oidc.enabled,
    oidcLabel: config.oidc.buttonLabel,
    apiKeys: (await listApiTokens(locals.user.id)).map((k) => ({ ...k, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null })),
    mcpUrl: `${config.publicUrl}/mcp`
  };
};
const actions = {
  rename: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    if (locals.user.isOidc) return fail(400, { message: "Dein Name kommt von deinem Login-Anbieter." });
    const name = String((await request.formData()).get("name") ?? "").trim();
    if (!name) return fail(400, { message: "Name fehlt." });
    await db.update(persons).set({ name }).where(eq(persons.id, locals.user.id));
    await db.update(kassen).set({ name }).where(eq(kassen.personalOf, locals.user.id));
    return { saved: true };
  },
  savePayment: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    const f = await request.formData();
    const str = (k) => String(f.get(k) ?? "").trim();
    const iban = str("iban");
    if (iban && !isValidIban(iban)) return fail(400, { paymentError: "Die IBAN ist ungültig." });
    const paypalRaw = str("paypalMe");
    const paypalMe = paypalRaw ? normalizePaypalMe(paypalRaw) : null;
    if (paypalRaw && !paypalMe) return fail(400, { paymentError: "Bitte nur deinen PayPal.me-Namen oder -Link angeben." });
    const values = {
      weroContact: str("weroContact") || null,
      iban: iban ? normalizeIban(iban) : null,
      accountHolder: str("accountHolder") || (iban ? locals.user.name : null),
      paypalMe,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db.insert(paymentDetails).values({ personId: locals.user.id, ...values }).onConflictDoUpdate({ target: paymentDetails.personId, set: values });
    return { paymentSaved: true };
  },
  deletePasskey: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    const id = String((await request.formData()).get("id"));
    await db.delete(credentials).where(and(eq(credentials.id, id), eq(credentials.personId, locals.user.id), eq(credentials.type, "passkey")));
    return { deleted: true };
  },
  /** Key for an AI assistant (MCP); shown only once. */
  createApiKey: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    const label = String((await request.formData()).get("label") ?? "").trim();
    return { apiKey: await createApiToken(locals.user.id, label || "KI-Assistent") };
  },
  revokeApiKey: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    await revokeApiToken(locals.user.id, String((await request.formData()).get("id")));
    return { revoked: true };
  },
  /** Short-lived login link for another device of the same person. */
  pairDevice: async ({ locals }) => {
    if (!locals.user) redirect(303, "/login");
    const { url } = await createPairingInvite(locals.user.id);
    return { pairing: { url, qr: await QRCode.toString(url, { type: "svg", margin: 1 }) } };
  },
  logoutOthers: async ({ locals }) => {
    if (!locals.user) redirect(303, "/login");
    const all = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.personId, locals.user.id));
    for (const s of all) {
      if (s.id !== locals.sessionId) await db.delete(sessions).where(eq(sessions.id, s.id));
    }
    return { loggedOut: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-XCbE0luo.js.map
