import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import { upsertOidcPerson } from '$lib/server/auth/oidc';
import { createSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

/** Local development only (DEV_LOGIN=true): log in as an "OIDC" user without an IdP. */
export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!config.devLogin) error(404);
	const name = String((await request.formData()).get('name') ?? '').trim();
	if (!name) error(400, 'Name fehlt');
	const personId = await upsertOidcPerson({
		sub: 'dev:' + name.toLowerCase(),
		name,
		email: null,
		picture: null,
		groups: []
	});
	await createSession(cookies, personId, true);
	redirect(303, '/');
};
