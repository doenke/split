import { json } from '@sveltejs/kit';
import { authenticationOptions, verifyAuthentication } from '$lib/server/auth/passkey';
import { createSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => json(await authenticationOptions(cookies));

export const POST: RequestHandler = async ({ cookies, request }) => {
	try {
		const personId = await verifyAuthentication(cookies, await request.json());
		await createSession(cookies, personId, false);
		return json({ ok: true });
	} catch (e) {
		return json({ message: (e as Error).message }, { status: 400 });
	}
};
