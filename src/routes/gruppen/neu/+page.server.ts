import { error, fail, redirect } from '@sveltejs/kit';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
import { defaultSettings } from '$lib/server/groups';
import { newId } from '$lib/server/ids';
import { personalKasseId } from '$lib/server/persons';
import { audit } from '$lib/server/audit';
import { createDefaultProfiles } from '$lib/server/profiles';
import { commonCurrencies, knownCurrencies } from '$lib/server/rates';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (!locals.user.isOidc) error(403, 'Nur Nutzer mit Login dürfen Gruppen anlegen.');
	const known = await knownCurrencies();
	return { currencies: [...new Set([...commonCurrencies, ...known])], defaultCurrency: config.defaultCurrency };
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

		const id = newId(10);
		const userId = locals.user.id;
		await db.transaction(async (tx) => {
			await tx.insert(schema.groups).values({
				id,
				name,
				emoji,
				baseCurrency: currency,
				startDate,
				endDate,
				settings: defaultSettings,
				createdBy: userId
			});
			await tx.insert(schema.memberships).values({
				groupId: id,
				personId: userId,
				role: 'admin',
				kasseId: await personalKasseId(tx, userId)
			});
			await createDefaultProfiles(tx, id);
			await audit(tx, { groupId: id, personId: userId, action: 'group.create', entityId: id });
		});
		redirect(303, `/gruppen/${id}/mitglieder?neu=1`);
	}
};
