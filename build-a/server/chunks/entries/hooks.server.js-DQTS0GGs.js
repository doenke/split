import { r as runMigrations } from '../chunks/index3.js-LeA4cvVT.js';
import { s as seedDefaults } from '../chunks/defaults.js-BfACFTys.js';
import { r as refreshRatesIfStale } from '../chunks/rates.js-C_LWDk2B.js';
import { c as cleanupOrphans } from '../chunks/uploads.js-Cm1gopuF.js';
import { p as purgeTrash } from '../chunks/trash.js-B9bmgopN.js';
import { v as validateSession, S as SESSION_COOKIE } from '../chunks/session.js-BTkwumJz.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'node:fs/promises';
import 'node:path';
import '../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';
import '../chunks/config.js-oO6Fsv50.js';

const init = async () => {
  await runMigrations();
  await seedDefaults();
  void refreshRatesIfStale();
  setInterval(() => {
    void refreshRatesIfStale();
    void cleanupOrphans().catch((e) => console.warn("Aufräumen der Belege fehlgeschlagen:", e));
    void purgeTrash().catch((e) => console.warn("Leeren des Papierkorbs fehlgeschlagen:", e));
  }, 36e5).unref();
};
const handle = async ({ event, resolve }) => {
  const result = await validateSession(event.cookies.get(SESSION_COOKIE));
  event.locals.user = result?.user ?? null;
  event.locals.sessionId = result?.sessionId ?? null;
  const response = await resolve(event);
  if (response.headers.get("content-type")?.startsWith("text/html")) {
    response.headers.set("cache-control", "no-cache");
  }
  return response;
};

export { handle, init };
//# sourceMappingURL=hooks.server.js-DQTS0GGs.js.map
