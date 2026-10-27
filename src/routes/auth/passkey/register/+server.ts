import { error, json } from '@sveltejs/kit';
import { registrationOptions, verifyRegistration } from '$lib/server/auth/passkey';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.user) error(401);
	return json(await registrationOptions(cookies, locals.user));
};

export const POST: RequestHandler = async ({ cookies, request, locals }) => {
	if (!locals.user) error(401);
	const label = (request.headers.get('x-device-label') ?? '').slice(0, 60) || null;
	try {
		await verifyRegistration(cookies, locals.user.id, await request.json(), label);
		return json({ ok: true });
	} catch (e) {
		return json({ message: (e as Error).message }, { status: 400 });
	}
};
