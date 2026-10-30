import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');
	const next = url.searchParams.get('next') ?? '/';
	const passkeys = await db
		.select({ id: schema.credentials.id })
		.from(schema.credentials)
		.where(and(eq(schema.credentials.personId, locals.user.id), eq(schema.credentials.type, 'passkey')));
	// came with a personal link: that link keeps working, a passkey is optional
	return { next: next.startsWith('/') ? next : '/', hasPasskey: passkeys.length > 0, viaLink: url.searchParams.has('link') };
};
