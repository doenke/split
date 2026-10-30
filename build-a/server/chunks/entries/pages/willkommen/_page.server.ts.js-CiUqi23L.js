import { N as redirect } from '../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq } from 'drizzle-orm';
import { d as db, h as credentials } from '../../../chunks/index3.js-LeA4cvVT.js';
import { c as config } from '../../../chunks/config.js-oO6Fsv50.js';
import { d as findInvite } from '../../../chunks/invites.js-DxO04p_p.js';

const load = async ({ locals, url }) => {
  if (!locals.user) redirect(303, "/login");
  const next = url.searchParams.get("next") ?? "/";
  const passkeys = await db.select({ id: credentials.id }).from(credentials).where(and(eq(credentials.personId, locals.user.id), eq(credentials.type, "passkey")));
  const token = url.searchParams.get("link");
  const invite = token ? await findInvite(token) : null;
  const link = invite && invite.invite.type === "personal" && invite.invite.personId === locals.user.id ? `${config.publicUrl}/j/${token}` : null;
  return { next: next.startsWith("/") ? next : "/", hasPasskey: passkeys.length > 0, link };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-CiUqi23L.js.map
