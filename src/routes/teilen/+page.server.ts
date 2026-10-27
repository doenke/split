import { redirect } from '@sveltejs/kit';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	const groups = await db
		.select({ id: schema.groups.id, name: schema.groups.name, emoji: schema.groups.emoji })
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.where(and(eq(schema.memberships.personId, locals.user.id), isNull(schema.groups.deletedAt), ne(schema.groups.status, 'archived')))
		.orderBy(desc(schema.groups.createdAt));
	return { groups };
};
