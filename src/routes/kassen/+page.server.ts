import { fail, redirect } from '@sveltejs/kit';
import { db, schema } from '$lib/server/db';
import { newId } from '$lib/server/ids';
import { kasseMembersOf, kasseOverview, sharedKassenOf } from '$lib/server/kassen';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const kassen = await sharedKassenOf(locals.user.id);
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
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Bitte einen Namen angeben.' });
		const id = newId();
		const userId = locals.user.id;
		await db.transaction(async (tx) => {
			await tx.insert(schema.kassen).values({ id, name, receiverPersonId: userId, createdBy: userId });
			await tx.insert(schema.kasseMembers).values({ kasseId: id, personId: userId, isManager: true });
		});
		redirect(303, `/kassen/${id}`);
	}
};
