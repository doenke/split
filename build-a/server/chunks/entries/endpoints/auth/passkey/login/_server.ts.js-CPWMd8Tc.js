import { j as json } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { a as authenticationOptions, v as verifyAuthentication } from '../../../../../chunks/passkey.js-ChAryyAf.js';
import { c as createSession } from '../../../../../chunks/session.js-BTkwumJz.js';
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

const GET = async ({ cookies }) => json(await authenticationOptions(cookies));
const POST = async ({ cookies, request }) => {
  try {
    const personId = await verifyAuthentication(cookies, await request.json());
    await createSession(cookies, personId, false);
    return json({ ok: true });
  } catch (e) {
    return json({ message: e.message }, { status: 400 });
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts.js-CPWMd8Tc.js.map
