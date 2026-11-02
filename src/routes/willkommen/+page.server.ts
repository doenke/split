import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** The old welcome page: the welcome card now appears right in the group. */
export const load: PageServerLoad = async ({ url }) => {
	const next = url.searchParams.get('next') ?? '/';
	redirect(303, `${next.startsWith('/') && !next.startsWith('//') ? next : '/'}?willkommen`);
};
