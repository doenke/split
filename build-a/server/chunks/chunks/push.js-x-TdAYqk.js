import webpush from 'web-push';
import { and, eq, inArray } from 'drizzle-orm';
import { b as private_env } from './shared-server.js-D1aJpbsf.js';
import { d as db, o as pushSubscriptions, q as appSettings, m as memberships } from './index3.js-LeA4cvVT.js';
import { n as newId } from './ids.js-2U6-pnrm.js';
import { c as config } from './config.js-oO6Fsv50.js';

let keys = null;
async function vapidKeys() {
  if (keys) return keys;
  if (private_env.VAPID_PUBLIC_KEY && private_env.VAPID_PRIVATE_KEY) {
    keys = { publicKey: private_env.VAPID_PUBLIC_KEY, privateKey: private_env.VAPID_PRIVATE_KEY };
  } else {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "vapid"));
    if (row) keys = JSON.parse(row.value);
    else {
      const generated = webpush.generateVAPIDKeys();
      await db.insert(appSettings).values({ key: "vapid", value: JSON.stringify(generated) }).onConflictDoNothing();
      const [stored] = await db.select().from(appSettings).where(eq(appSettings.key, "vapid"));
      keys = JSON.parse(stored.value);
    }
  }
  webpush.setVapidDetails(private_env.VAPID_SUBJECT ?? `mailto:split@${new URL(config.publicUrl).hostname}`, keys.publicKey, keys.privateKey);
  return keys;
}
async function saveSubscription(personId, sub, label) {
  const values = { personId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, label };
  await db.insert(pushSubscriptions).values({ id: newId(), endpoint: sub.endpoint, ...values }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: values });
}
async function removeSubscription(personId, endpoint) {
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.personId, personId), eq(pushSubscriptions.endpoint, endpoint)));
}
async function notify(personIds, message) {
  const ids = [...new Set(personIds)];
  if (!ids.length) return;
  try {
    await vapidKeys();
    const subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.personId, ids));
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(message),
            { TTL: 60 * 60 * 24 }
          );
        } catch (e) {
          const status = e.statusCode;
          if (status === 404 || status === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
          } else {
            console.warn("Push fehlgeschlagen:", status ?? e.message);
          }
        }
      })
    );
  } catch (e) {
    console.warn("Push fehlgeschlagen:", e.message);
  }
}
async function groupRecipients(groupId, exceptId) {
  const rows = await db.select({ personId: memberships.personId }).from(memberships).where(and(eq(memberships.groupId, groupId), eq(memberships.muted, false)));
  return rows.map((r) => r.personId).filter((id) => id !== exceptId);
}
async function kasseRecipients(groupId, kasseId, exceptId) {
  const rows = await db.select({ personId: memberships.personId }).from(memberships).where(and(eq(memberships.groupId, groupId), eq(memberships.kasseId, kasseId), eq(memberships.muted, false)));
  return rows.map((r) => r.personId).filter((id) => id !== exceptId);
}

export { groupRecipients as g, kasseRecipients as k, notify as n, removeSubscription as r, saveSubscription as s, vapidKeys as v };
//# sourceMappingURL=push.js-x-TdAYqk.js.map
