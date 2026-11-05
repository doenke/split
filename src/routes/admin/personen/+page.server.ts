import { fail } from '@sveltejs/kit';
import { requireInstanceAdmin } from '$lib/server/admin';
import { and, count, eq, isNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { audit } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';
import { shownName } from '$lib/server/display';


export const load: PageServerLoad = async ({ locals }) => {
	requireInstanceAdmin(locals.user);
	const [persons, creds, groups] = await Promise.all([
		db
			.select({
				id: schema.persons.id,
				name: schema.persons.name,
				display: shownName,
				email: schema.persons.email,
				color: schema.persons.color,
				avatarUrl: schema.persons.avatarUrl,
				isAdmin: schema.persons.isAdmin,
				deactivatedAt: schema.persons.deactivatedAt,
				lastLoginAt: schema.persons.lastLoginAt
			})
			.from(schema.persons)
			.where(isNull(schema.persons.mergedInto))
			.orderBy(schema.persons.name),
		db.selectDistinct({ personId: schema.credentials.personId, type: schema.credentials.type }).from(schema.credentials),
		db
			.select({ personId: schema.memberships.personId, n: count() })
			.from(schema.memberships)
			.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
			.where(isNull(schema.groups.deletedAt))
			.groupBy(schema.memberships.personId)
	]);
	const groupCount = new Map(groups.map((g) => [g.personId, g.n]));
	return {
		persons: persons.map((p) => {
			const types = creds.filter((c) => c.personId === p.id).map((c) => c.type);
			return {
				...p,
				deactivatedAt: p.deactivatedAt?.toISOString() ?? null,
				lastLoginAt: p.lastLoginAt?.toISOString() ?? null,
				access: types.includes('oidc') ? 'Login' : types.includes('passkey') ? 'Passkey' : 'ohne Zugang',
				groups: groupCount.get(p.id) ?? 0
			};
		})
	};
};

export const actions: Actions = {
	toggle: async ({ locals, request }) => {
		const user = requireInstanceAdmin(locals.user);
		const f = await request.formData();
		const id = String(f.get('id'));
		const deactivate = f.get('deactivate') === '1';
		if (id === user.id) return fail(400, { message: 'Du kannst dich nicht selbst deaktivieren.' });
		await db
			.update(schema.persons)
			.set({ deactivatedAt: deactivate ? new Date() : null })
			.where(and(eq(schema.persons.id, id), isNull(schema.persons.mergedInto)));
		await audit(db, { groupId: null, personId: user.id, action: deactivate ? 'person.deactivate' : 'person.activate', entityId: id });
		return { ok: true };
	}
};
