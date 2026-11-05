import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireGroup, requireGroupAdmin } from '$lib/server/groups';
import { audit } from '$lib/server/audit';
import { reopen } from '$lib/server/closing';
import { resetCompletion } from '$lib/server/completion';
import { newId } from '$lib/server/ids';
import { isCurrency, selectableCurrencies } from '$lib/server/currencies';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const g = await requireGroup(params.id, locals.user);
	const log = await db
		.select()
		.from(schema.auditLog)
		.where(eq(schema.auditLog.groupId, params.id))
		.orderBy(schema.auditLog.createdAt);
	const used = (await db.selectDistinct({ c: schema.expenses.currency }).from(schema.expenses).where(eq(schema.expenses.groupId, params.id))).map((r) => r.c);
	return {
		log: log.slice(-30).reverse(),
		muted: g.membership.muted,
		// chosen alternatives, or (never chosen) the foreign currencies already used
		altCurrencies: g.group.settings.currencies ?? used.filter((c) => c !== g.group.baseCurrency),
		selectableCurrencies: (await selectableCurrencies(g.group.settings.currencies ?? [])).filter((c) => c !== g.group.baseCurrency)
	};
};

const colors = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#8ab17d', '#b56576', '#6d597a', '#457b9d'];

export const actions: Actions = {
	/** An own category for this group; it is offered right away. */
	addCategory: async ({ params, locals, request }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim().slice(0, 40);
		const icon = String(f.get('icon') ?? '').trim().slice(0, 8) || '🏷️';
		if (!name) return fail(400, { message: 'Bitte einen Namen für die Kategorie angeben.' });
		const id = newId();
		await db.insert(schema.categories).values({ id, groupId: params.id, name, icon, color: colors[Math.floor(Math.random() * colors.length)], sort: 100 });
		if (g.group.settings.categories) {
			await db
				.update(schema.groups)
				.set({ settings: { ...g.group.settings, categories: [...g.group.settings.categories, id] } })
				.where(eq(schema.groups.id, params.id));
		}
		return { categoryAdded: name };
	},
	/** New icon for one of the group's own categories. */
	categoryIcon: async ({ params, locals, request }) => {
		await requireGroupAdmin(params.id, locals.user);
		const f = await request.formData();
		const icon = String(f.get('icon') ?? '').trim().slice(0, 8);
		if (!icon) return fail(400, { message: 'Bitte ein Symbol wählen.' });
		await db
			.update(schema.categories)
			.set({ icon })
			.where(and(eq(schema.categories.id, String(f.get('id'))), eq(schema.categories.groupId, params.id)));
		return { iconSaved: true };
	},
	save: async ({ params, locals, request }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name fehlt.' });
		const startDate = String(f.get('startDate') ?? '') || null;
		const endDate = String(f.get('endDate') ?? '') || null;
		const settings = {
			simplifyDebts: f.get('simplifyDebts') === 'on',
			editOthers: f.get('editOthers') === 'on' ? ('all' as const) : ('admins' as const),
			membersCanAddPeople: f.get('membersCanAddPeople') === 'on',
			quiet: f.get('quiet') === 'on',
			confirmPayments: f.get('confirmPayments') === 'on',
			adultsAreAdmins: f.get('adultsAreAdmins') === 'on',
			currencies: [...new Set(f.getAll('currency').map(String))].filter((c) => isCurrency(c) && c !== g.group.baseCurrency),
			categories: f.getAll('category').map(String)
		};
		await db
			.update(schema.groups)
			.set({ name, emoji: String(f.get('emoji') ?? '').trim() || g.group.emoji, startDate, endDate, settings })
			.where(eq(schema.groups.id, params.id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.update', entityId: params.id });
		return { saved: true };
	},
	toggleMute: async ({ params, locals }) => {
		const g = await requireGroup(params.id, locals.user);
		await db
			.update(schema.memberships)
			.set({ muted: !g.membership.muted })
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, g.user.id)));
		return { muted: !g.membership.muted };
	},
	reopen: async ({ params, locals }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		await reopen(params.id, null);
		await resetCompletion(params.id);
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.reopen' });
		return { reopened: true };
	},
	/** Archiving is the only manual phase; unarchiving returns to the phase the group is in. */
	archive: async ({ params, locals }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		await db.update(schema.groups).set({ archivedAt: new Date() }).where(eq(schema.groups.id, params.id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.archive' });
		return { archived: true };
	},
	unarchive: async ({ params, locals }) => {
		const g = await requireGroupAdmin(params.id, locals.user);
		await db.update(schema.groups).set({ archivedAt: null }).where(eq(schema.groups.id, params.id));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.unarchive' });
		return { unarchived: true };
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
