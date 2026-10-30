import { C as error, N as redirect } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { c as config } from '../../../../chunks/config.js-oO6Fsv50.js';
import { u as upsertOidcPerson } from '../../../../chunks/oidc.js-CCVg07T_.js';
import { c as createSession } from '../../../../chunks/session.js-BTkwumJz.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import '../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'openid-client';
import 'drizzle-orm';
import '../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import 'drizzle-orm/pg-core';
import '../../../../chunks/persons.js-DwTcpoqM.js';
import '../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const POST = async ({ request, cookies }) => {
  if (!config.devLogin) error(404);
  const name = String((await request.formData()).get("name") ?? "").trim();
  if (!name) error(400, "Name fehlt");
  const personId = await upsertOidcPerson({
    sub: "dev:" + name.toLowerCase(),
    name,
    email: null,
    picture: null,
    groups: []
  });
  await createSession(cookies, personId, true);
  redirect(303, "/");
};

export { POST };
//# sourceMappingURL=_server.ts.js-DMnzvX5l.js.map
