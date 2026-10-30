import { C as error, j as json } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { r as registrationOptions, b as verifyRegistration } from '../../../../../chunks/passkey.js-ChAryyAf.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import '@simplewebauthn/server';
import 'drizzle-orm';
import '../../../../../chunks/config.js-oO6Fsv50.js';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import '../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import 'drizzle-orm/pg-core';
import '../../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const GET = async ({ cookies, locals }) => {
  if (!locals.user) error(401);
  return json(await registrationOptions(cookies, locals.user));
};
const POST = async ({ cookies, request, locals }) => {
  if (!locals.user) error(401);
  const label = (request.headers.get("x-device-label") ?? "").slice(0, 60) || null;
  try {
    await verifyRegistration(cookies, locals.user.id, await request.json(), label);
    return json({ ok: true });
  } catch (e) {
    return json({ message: e.message }, { status: 400 });
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts.js-CuumApvk.js.map
