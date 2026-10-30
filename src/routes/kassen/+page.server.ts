import { fail, redirect } from '@sveltejs/kit';
import { db, schema } from '$lib/server/db';
import { newId } from '$lib/server/ids';
import { accessibleKassenOf, kasseMembersOf, kasseOverview } from '$lib/server/kassen';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const kassen = await accessibleKassenOf(locals.user.id);
	return {
		kassen: await Promise.all(
			kassen.map(async (k) => ({
				...k,
				members: await kasseMembersOf(k.id),
				totals: (await kasseOverview(k.id)).totals
			}))
		)
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Bitte einen Namen angeben.' });
		// a Kasse can also be set up for others (e.g. friends): then the creator only manages it
		const includeMe = f.get('includeMe') === 'on';
		const id = newId();
		const userId = locals.user.id;
		await db.transaction(async (tx) => {
			await tx.insert(schema.kassen).values({ id, name, receiverPersonId: includeMe ? userId : null, createdBy: userId });
			if (includeMe) await tx.insert(schema.kasseMembers).values({ kasseId: id, personId: userId, isManager: true });
		});
		redirect(303, `/kassen/${id}`);
	}
};
