import { redirect } from '@sveltejs/kit';
import { buildLoginUrl } from '$lib/server/auth/oidc';
import { config } from '$lib/server/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	let login;
	try {
		login = await buildLoginUrl();
	} catch (e) {
		console.error('OIDC discovery failed', e);
		redirect(303, '/login?error=' + encodeURIComponent('Der Login-Anbieter ist nicht erreichbar.'));
	}
	const opts = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: config.secureCookies, maxAge: 600 };
	cookies.set('oidc_verifier', login.verifier, opts);
	cookies.set('oidc_state', login.state, opts);
	cookies.set('oidc_next', url.searchParams.get('next') ?? '/', opts);
	redirect(303, login.url.href);
};
