import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireGroupAdmin } from '$lib/server/groups';
import { newId } from '$lib/server/ids';
import { audit } from '$lib/server/audit';
import { ruleFromForm } from '$lib/server/profiles';
import type { Actions } from './$types';

export const actions: Actions = {
	save: async ({ params, locals, request }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Bitte einen Namen angeben.' });
		const values = {
			name,
			icon: String(f.get('icon') ?? '').trim() || '🏷️',
			rule: ruleFromForm(f),
			defaultCategoryId: String(f.get('defaultCategoryId') ?? '') || null
		};
		const id = String(f.get('id') ?? '');
		if (id) {
			const res = await db
				.update(schema.profiles)
				.set(values)
				.where(and(eq(schema.profiles.id, id), eq(schema.profiles.groupId, params.id)))
				.returning({ id: schema.profiles.id });
			if (!res.length) error(404);
		} else {
			await db.insert(schema.profiles).values({ id: newId(), groupId: params.id, sort: 99, ...values });
		}
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'profile.save', entityId: id || undefined, data: { title: name } });
		return { saved: true };
	},
	delete: async ({ params, locals, request }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		const id = String((await request.formData()).get('id'));
		const [p] = await db
			.select()
			.from(schema.profiles)
			.where(and(eq(schema.profiles.id, id), eq(schema.profiles.groupId, params.id)));
		if (!p) error(404);
		// expenses using the profile keep their split: the rule is copied into them
		await db
			.update(schema.expenses)
			.set({ rule: p.rule })
			.where(and(eq(schema.expenses.profileId, id), eq(schema.expenses.groupId, params.id), isNull(schema.expenses.rule)));
		await db
			.update(schema.expenses)
			.set({ profileId: null })
			.where(and(eq(schema.expenses.profileId, id), eq(schema.expenses.groupId, params.id)));
		await db.delete(schema.profiles).where(eq(schema.profiles.id, id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'profile.delete', entityId: id, data: { title: p.name } });
		return { deleted: true };
	}
};
