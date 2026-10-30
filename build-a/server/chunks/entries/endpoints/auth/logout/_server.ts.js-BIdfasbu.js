import { d as destroySession } from '../../../../chunks/session.js-BTkwumJz.js';
import 'drizzle-orm';
import '../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';
import '../../../../chunks/config.js-oO6Fsv50.js';

const POST = async ({ cookies, locals }) => {
  await destroySession(cookies, locals.sessionId);
  return new Response(null, { status: 303, headers: { location: "/login", "clear-site-data": '"cache"' } });
};

export { POST };
//# sourceMappingURL=_server.ts.js-BIdfasbu.js.map
