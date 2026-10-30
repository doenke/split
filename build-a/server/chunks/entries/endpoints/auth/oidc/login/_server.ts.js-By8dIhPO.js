import { N as redirect } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { b as buildLoginUrl } from '../../../../../chunks/oidc.js-CCVg07T_.js';
import { c as config } from '../../../../../chunks/config.js-oO6Fsv50.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import 'openid-client';
import 'drizzle-orm';
import '../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../../../chunks/persons.js-DwTcpoqM.js';
import '../../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const GET = async ({ cookies, url }) => {
  let login;
  try {
    login = await buildLoginUrl();
  } catch (e) {
    console.error("OIDC discovery failed", e);
    redirect(303, "/login?error=" + encodeURIComponent("Der Login-Anbieter ist nicht erreichbar."));
  }
  const opts = { path: "/", httpOnly: true, sameSite: "lax", secure: config.secureCookies, maxAge: 600 };
  cookies.set("oidc_verifier", login.verifier, opts);
  cookies.set("oidc_state", login.state, opts);
  cookies.set("oidc_next", url.searchParams.get("next") ?? "/", opts);
  redirect(303, login.url.href);
};

export { GET };
//# sourceMappingURL=_server.ts.js-By8dIhPO.js.map
