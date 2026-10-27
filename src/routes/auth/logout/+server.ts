import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	await destroySession(cookies, locals.sessionId);
	redirect(303, '/login');
};
