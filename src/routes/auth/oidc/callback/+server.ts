import { redirect } from '@sveltejs/kit';
import { handleCallback, upsertOidcPerson } from '$lib/server/auth/oidc';
import { createSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url, locals }) => {
	const verifier = cookies.get('oidc_verifier');
	const state = cookies.get('oidc_state');
	const next = cookies.get('oidc_next') ?? '/';
	for (const c of ['oidc_verifier', 'oidc_state', 'oidc_next']) cookies.delete(c, { path: '/' });
	if (!verifier || !state) redirect(303, '/login?error=' + encodeURIComponent('Anmeldung abgelaufen, bitte erneut versuchen.'));

	let personId: string;
	try {
		const profile = await handleCallback(url, verifier, state);
		// a logged-in guest linking their OIDC account keeps their person
		personId = await upsertOidcPerson(profile, locals.user && !locals.user.isOidc ? locals.user.id : null);
	} catch (e) {
		console.error('OIDC callback failed', e);
		redirect(303, '/login?error=' + encodeURIComponent('Anmeldung fehlgeschlagen.'));
	}
	await createSession(cookies, personId, true);
	redirect(303, next.startsWith('/') ? next : '/');
};
