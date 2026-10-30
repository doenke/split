import { N as redirect } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { h as handleCallback, u as upsertOidcPerson } from '../../../../../chunks/oidc.js-CCVg07T_.js';
import { c as createSession } from '../../../../../chunks/session.js-BTkwumJz.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import 'openid-client';
import 'drizzle-orm';
import '../../../../../chunks/config.js-oO6Fsv50.js';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import '../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import 'drizzle-orm/pg-core';
import '../../../../../chunks/persons.js-DwTcpoqM.js';
import '../../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const GET = async ({ cookies, url, locals }) => {
  const verifier = cookies.get("oidc_verifier");
  const state = cookies.get("oidc_state");
  const next = cookies.get("oidc_next") ?? "/";
  for (const c of ["oidc_verifier", "oidc_state", "oidc_next"]) cookies.delete(c, { path: "/" });
  if (!verifier || !state) redirect(303, "/login?error=" + encodeURIComponent("Anmeldung abgelaufen, bitte erneut versuchen."));
  let personId;
  try {
    const profile = await handleCallback(url, verifier, state);
    personId = await upsertOidcPerson(profile, locals.user && !locals.user.isOidc ? locals.user.id : null);
  } catch (e) {
    console.error("OIDC callback failed", e);
    redirect(303, "/login?error=" + encodeURIComponent("Anmeldung fehlgeschlagen."));
  }
  await createSession(cookies, personId, true);
  redirect(303, next.startsWith("/") ? next : "/");
};

export { GET };
//# sourceMappingURL=_server.ts.js-BW_9KGo7.js.map
