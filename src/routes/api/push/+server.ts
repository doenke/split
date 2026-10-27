import { error, json } from '@sveltejs/kit';
import { removeSubscription, saveSubscription, vapidKeys } from '$lib/server/push';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => json({ publicKey: (await vapidKeys()).publicKey });

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401);
	const body = await request.json();
	if (typeof body?.endpoint !== 'string' || !body.endpoint.startsWith('https://') || !body.keys?.p256dh || !body.keys?.auth) {
		error(400, 'Ungültiges Abonnement');
	}
	await saveSubscription(locals.user.id, body, String(body.label ?? '').slice(0, 60) || null);
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401);
	const { endpoint } = await request.json();
	await removeSubscription(locals.user.id, String(endpoint));
	return json({ ok: true });
};
