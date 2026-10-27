import { destroySession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	await destroySession(cookies, locals.sessionId);
	// also drop pages the service worker cached for this user
	return new Response(null, { status: 303, headers: { location: '/login', 'clear-site-data': '"cache"' } });
};
