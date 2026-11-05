import { fail, redirect } from '@sveltejs/kit';
import { and, inArray, isNotNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { newId } from '$lib/server/ids';
import { accessibleKassenOf, kasseMembersOf, kasseOverview } from '$lib/server/kassen';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const all = await Promise.all(
		(await accessibleKassenOf(locals.user.id)).map(async (k) => ({ ...k, members: await kasseMembersOf(k.id) }))
	);
	// Kassen set up for others are handed over once one of their managers has logged in: they leave this list
	// (the creator can still open them; instance admins find all of them under Admin → Kassen)
	const managers = [...new Set(all.filter((k) => !k.isMember).flatMap((k) => k.members.filter((m) => m.isManager).map((m) => m.personId)))];
	const loggedIn = new Set(
		managers.length
			? (
					await db
						.select({ id: schema.persons.id })
						.from(schema.persons)
						.where(and(inArray(schema.persons.id, managers), isNotNull(schema.persons.lastLoginAt)))
				).map((r) => r.id)
			: []
	);
	const kassen = all.filter((k) => k.isMember || !k.members.some((m) => m.isManager && loggedIn.has(m.personId)));
	return {
		kassen: await Promise.all(kassen.map(async (k) => ({ ...k, totals: (await kasseOverview(k.id)).totals }))),
		handedOver: all.length - kassen.length
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
