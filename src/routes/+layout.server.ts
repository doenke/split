import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// just arrived via an invitation: the welcome card offers a passkey if there is none yet
	let hasPasskey: boolean | null = null;
	if (locals.user && url.searchParams.has('willkommen')) {
		const rows = await db
			.select({ id: schema.credentials.id })
			.from(schema.credentials)
			.where(and(eq(schema.credentials.personId, locals.user.id), eq(schema.credentials.type, 'passkey')))
			.limit(1);
		hasPasskey = rows.length > 0;
	}
	return { user: locals.user, hasPasskey, loginProvider: config.oidc.providerName };
};
