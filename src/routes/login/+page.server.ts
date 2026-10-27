import { redirect } from '@sveltejs/kit';
import { config } from '$lib/server/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, url.searchParams.get('next') ?? '/');
	return {
		oidcEnabled: config.oidc.enabled,
		oidcLabel: config.oidc.buttonLabel,
		devLogin: config.devLogin,
		error: url.searchParams.get('error')
	};
};
