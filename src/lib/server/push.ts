import webpush from 'web-push';
import { and, eq, inArray } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db, schema } from './db';
import { newId } from './ids';
import { config } from './config';

let keys: { publicKey: string; privateKey: string } | null = null;

/** VAPID keys from the environment, or generated once and stored in the database. */
export async function vapidKeys() {
	if (keys) return keys;
	if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
		keys = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
	} else {
		const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'vapid'));
		if (row) keys = JSON.parse(row.value);
		else {
			const generated = webpush.generateVAPIDKeys();
			await db
				.insert(schema.appSettings)
				.values({ key: 'vapid', value: JSON.stringify(generated) })
				.onConflictDoNothing();
			const [stored] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'vapid'));
			keys = JSON.parse(stored.value);
		}
	}
	webpush.setVapidDetails(env.VAPID_SUBJECT ?? `mailto:split@${new URL(config.publicUrl).hostname}`, keys!.publicKey, keys!.privateKey);
	return keys!;
}

export async function saveSubscription(
	personId: string,
	sub: { endpoint: string; keys: { p256dh: string; auth: string } },
	label: string | null
) {
	const values = { personId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, label };
	await db
		.insert(schema.pushSubscriptions)
		.values({ id: newId(), endpoint: sub.endpoint, ...values })
		.onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: values });
}

export async function removeSubscription(personId: string, endpoint: string) {
	await db
		.delete(schema.pushSubscriptions)
		.where(and(eq(schema.pushSubscriptions.personId, personId), eq(schema.pushSubscriptions.endpoint, endpoint)));
}

export interface PushMessage {
	title: string;
	body: string;
	url: string;
	tag?: string;
}

/** Sends a notification to all devices of the given people. Never throws. */
export async function notify(personIds: string[], message: PushMessage) {
	const ids = [...new Set(personIds)];
	if (!ids.length) return;
	try {
		await vapidKeys();
		const subs = await db.select().from(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.personId, ids));
		await Promise.all(
			subs.map(async (s) => {
				try {
					await webpush.sendNotification(
						{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
						JSON.stringify(message),
						{ TTL: 60 * 60 * 24 }
					);
				} catch (e) {
					const status = (e as { statusCode?: number }).statusCode;
					// subscription expired or was revoked in the browser
					if (status === 404 || status === 410) {
						await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
					} else {
						console.warn('Push fehlgeschlagen:', status ?? (e as Error).message);
					}
				}
			})
		);
	} catch (e) {
		console.warn('Push fehlgeschlagen:', (e as Error).message);
	}
}

/** Group members (not muted) except `exceptId`. */
export async function groupRecipients(groupId: string, exceptId: string | null) {
	const rows = await db
		.select({ personId: schema.memberships.personId })
		.from(schema.memberships)
		.where(and(eq(schema.memberships.groupId, groupId), eq(schema.memberships.muted, false)));
	return rows.map((r) => r.personId).filter((id) => id !== exceptId);
}

/** Members of a Kasse who are in the group and have not muted it. */
export async function kasseRecipients(groupId: string, kasseId: string, exceptId: string | null) {
	const rows = await db
		.select({ personId: schema.memberships.personId })
		.from(schema.memberships)
		.where(and(eq(schema.memberships.groupId, groupId), eq(schema.memberships.kasseId, kasseId), eq(schema.memberships.muted, false)));
	return rows.map((r) => r.personId).filter((id) => id !== exceptId);
}
