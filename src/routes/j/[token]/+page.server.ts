import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { findInvite, markInviteUsed } from '$lib/server/auth/invites';
import { createSession, destroySession } from '$lib/server/auth/session';
import { db, schema } from '$lib/server/db';
import { mergePersons } from '$lib/server/persons';
import type { Actions, PageServerLoad } from './$types';

async function loadInvite(token: string) {
	const invite = await findInvite(token);
	if (!invite || !invite.person) error(404, 'Dieser Link ist ungültig, abgelaufen oder wurde schon benutzt. Bitte lass dir einen neuen Link schicken.');
	let group = null;
	if (invite.invite.groupId) {
		[group] = await db
			.select({ id: schema.groups.id, name: schema.groups.name, emoji: schema.groups.emoji })
			.from(schema.groups)
			.where(eq(schema.groups.id, invite.invite.groupId));
	}
	return { ...invite, person: invite.person, group: group ?? null };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { person, group } = await loadInvite(params.token);
	return {
		person: { id: person.id, name: person.name, color: person.color, avatarUrl: person.avatarUrl },
		group,
		sameUser: locals.user?.id === person.id
	};
};

export const actions: Actions = {
	/** "Yes, that's me": log in as the invited person. */
	claim: async ({ params, cookies, locals }) => {
		const { person, group } = await loadInvite(params.token);
		if (locals.user && locals.user.id !== person.id) await destroySession(cookies, locals.sessionId);
		await createSession(cookies, person.id, false);
		await markInviteUsed(params.token);
		redirect(303, `/willkommen?next=${encodeURIComponent(group ? `/gruppen/${group.id}` : '/')}`);
	},
	/** Already logged in as someone else: the invited placeholder is me – merge it into my person. */
	merge: async ({ params, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const { person, group } = await loadInvite(params.token);
		try {
			await mergePersons(person.id, locals.user.id);
		} catch (e) {
			return fail(400, { message: (e as Error).message });
		}
		await markInviteUsed(params.token);
		redirect(303, group ? `/gruppen/${group.id}` : '/');
	}
};
