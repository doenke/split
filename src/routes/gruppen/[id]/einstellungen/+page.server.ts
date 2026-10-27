import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireGroup, requireGroupAdmin } from '$lib/server/groups';
import { audit } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	await requireGroup(params.id, locals.user);
	const log = await db
		.select()
		.from(schema.auditLog)
		.where(eq(schema.auditLog.groupId, params.id))
		.orderBy(schema.auditLog.createdAt);
	return { log: log.slice(-30).reverse() };
};

export const actions: Actions = {
	save: async ({ params, locals, request }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name fehlt.' });
		const startDate = String(f.get('startDate') ?? '') || null;
		const endDate = String(f.get('endDate') ?? '') || null;
		const status = (['active', 'settled', 'archived'] as const).find((s) => s === f.get('status')) ?? 'active';
		const settings = {
			simplifyDebts: f.get('simplifyDebts') === 'on',
			editOthers: f.get('editOthers') === 'admins' ? ('admins' as const) : ('all' as const),
			membersCanAddPeople: f.get('membersCanAddPeople') === 'on'
		};
		await db
			.update(schema.groups)
			.set({ name, emoji: String(f.get('emoji') ?? '').trim() || g.group.emoji, startDate, endDate, status, settings })
			.where(eq(schema.groups.id, params.id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.update', entityId: params.id });
		return { saved: true };
	},
	delete: async ({ params, locals, request }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		const confirmName = String((await request.formData()).get('confirm') ?? '');
		if (confirmName !== g.group.name) return fail(400, { message: 'Zum Löschen bitte den Gruppennamen exakt eingeben.' });
		if (!g.user.isOidc && g.group.createdBy !== g.user.id) error(403);
		await db.update(schema.groups).set({ deletedAt: new Date() }).where(eq(schema.groups.id, params.id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.delete', entityId: params.id });
		redirect(303, '/');
	}
};
