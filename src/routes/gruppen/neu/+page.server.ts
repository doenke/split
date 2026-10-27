import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
import { defaultSettings, loadMembers, loadProfiles } from '$lib/server/groups';
import { newId } from '$lib/server/ids';
import { personalKasseId } from '$lib/server/persons';
import { audit } from '$lib/server/audit';
import { createDefaultProfiles } from '$lib/server/profiles';
import { commonCurrencies, knownCurrencies } from '$lib/server/rates';
import type { Actions, PageServerLoad } from './$types';

async function myGroups(userId: string) {
	return db
		.select({ id: schema.groups.id, name: schema.groups.name, emoji: schema.groups.emoji, currency: schema.groups.baseCurrency })
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.where(and(eq(schema.memberships.personId, userId), isNull(schema.groups.deletedAt)))
		.orderBy(schema.groups.name);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');
	if (!locals.user.isOidc) error(403, 'Nur Nutzer mit Login dürfen Gruppen anlegen.');
	const known = await knownCurrencies();
	return {
		currencies: [...new Set([...commonCurrencies, ...known])],
		defaultCurrency: config.defaultCurrency,
		templates: await myGroups(locals.user.id),
		templateId: url.searchParams.get('vorlage')
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user?.isOidc) error(403);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const emoji = String(f.get('emoji') ?? '').trim() || '🧳';
		const currency = String(f.get('currency') ?? 'EUR');
		const startDate = String(f.get('startDate') ?? '') || null;
		const endDate = String(f.get('endDate') ?? '') || null;
		if (!name) return fail(400, { message: 'Bitte gib einen Namen an.' });
		if (!/^[A-Z]{3}$/.test(currency)) return fail(400, { message: 'Ungültige Währung.' });

		const userId = locals.user.id;
		const templateId = String(f.get('template') ?? '');
		let template = null;
		if (templateId) {
			template = (await myGroups(userId)).find((g) => g.id === templateId);
			if (!template) return fail(400, { message: 'Vorlage nicht gefunden.' });
		}
		const copyPeople = template && f.get('copyPeople') === 'on';
		const copyProfiles = template && f.get('copyProfiles') === 'on';
		const [templateRow] = template ? await db.select().from(schema.groups).where(eq(schema.groups.id, template.id)) : [];

		const id = newId(10);
		await db.transaction(async (tx) => {
			await tx.insert(schema.groups).values({
				id,
				name,
				emoji,
				baseCurrency: currency,
				startDate,
				endDate,
				settings: templateRow?.settings ?? defaultSettings,
				templateOf: template?.id ?? null,
				createdBy: userId
			});
			const members = copyPeople ? await loadMembers(template!.id) : [];
			const me = members.find((m) => m.personId === userId);
			await tx.insert(schema.memberships).values({
				groupId: id,
				personId: userId,
				role: 'admin',
				factor: me?.factor ?? 1,
				tags: me?.tags ?? [],
				kasseId: me?.kasseId ?? (await personalKasseId(tx, userId))
			});
			for (const m of members) {
				if (m.personId === userId) continue;
				// participation dates belong to the old trip and are not copied
				await tx.insert(schema.memberships).values({
					groupId: id,
					personId: m.personId,
					role: m.role,
					factor: m.factor,
					tags: m.tags,
					kasseId: m.kasseId
				});
			}
			if (copyProfiles) {
				const profiles = await loadProfiles(template!.id);
				if (profiles.length) {
					await tx.insert(schema.profiles).values(
						profiles.map((p) => ({ id: newId(), groupId: id, name: p.name, icon: p.icon, rule: p.rule, defaultCategoryId: p.defaultCategoryId, sort: p.sort }))
					);
				}
			} else {
				await createDefaultProfiles(tx, id);
			}
			await audit(tx, { groupId: id, personId: userId, action: 'group.create', entityId: id, data: template ? { template: template.name } : undefined });
		});
		redirect(303, copyPeople ? `/gruppen/${id}` : `/gruppen/${id}/mitglieder?neu=1`);
	}
};
