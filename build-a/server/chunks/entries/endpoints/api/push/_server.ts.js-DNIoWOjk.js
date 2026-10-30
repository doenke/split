import { C as error, j as json } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { r as removeSubscription, v as vapidKeys, s as saveSubscription } from '../../../../chunks/push.js-x-TdAYqk.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import 'web-push';
import 'drizzle-orm';
import '../../../../chunks/shared-server.js-D1aJpbsf.js';
import '../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import 'drizzle-orm/pg-core';
import '../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';
import '../../../../chunks/config.js-oO6Fsv50.js';

const GET = async () => json({ publicKey: (await vapidKeys()).publicKey });
const POST = async ({ locals, request }) => {
  if (!locals.user) error(401);
  const body = await request.json();
  if (typeof body?.endpoint !== "string" || !body.endpoint.startsWith("https://") || !body.keys?.p256dh || !body.keys?.auth) {
    error(400, "Ungültiges Abonnement");
  }
  await saveSubscription(locals.user.id, body, String(body.label ?? "").slice(0, 60) || null);
  return json({ ok: true });
};
const DELETE = async ({ locals, request }) => {
  if (!locals.user) error(401);
  const { endpoint } = await request.json();
  await removeSubscription(locals.user.id, String(endpoint));
  return json({ ok: true });
};

export { DELETE, GET, POST };
//# sourceMappingURL=_server.ts.js-DNIoWOjk.js.map
