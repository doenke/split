import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
import { findInvite } from '$lib/server/auth/invites';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');
	const next = url.searchParams.get('next') ?? '/';
	const passkeys = await db
		.select({ id: schema.credentials.id })
		.from(schema.credentials)
		.where(and(eq(schema.credentials.personId, locals.user.id), eq(schema.credentials.type, 'passkey')));
	// came with a personal link: that link keeps working, a passkey is optional
	const token = url.searchParams.get('link');
	const invite = token ? await findInvite(token) : null;
	const link = invite && invite.invite.type === 'personal' && invite.invite.personId === locals.user.id ? `${config.publicUrl}/j/${token}` : null;
	return { next: next.startsWith('/') ? next : '/', hasPasskey: passkeys.length > 0, link };
};
