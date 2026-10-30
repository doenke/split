import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { findGroupInvite } from '$lib/server/auth/invites';
import { createSession } from '$lib/server/auth/session';
import { loadMembers } from '$lib/server/groups';
import { claimedPersonIds, createPerson, mergePersons, nameFromForm, personalKasseId, sameName } from '$lib/server/persons';
import { pickKasseForGroup } from '$lib/server/kassen';
import { audit } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

async function loadInvite(token: string) {
	const row = await findGroupInvite(token);
	if (!row) error(404, 'Dieser Einladungslink ist ungültig oder abgelaufen. Bitte frag nach einem neuen.');
	return row;
}

/** Members that nobody has claimed yet – the "Who are you?" choices. */
async function unclaimed(groupId: string) {
	const members = await loadMembers(groupId);
	const claimed = await claimedPersonIds(members.map((m) => m.personId));
	return members.filter((m) => !claimed.has(m.personId));
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { group } = await loadInvite(params.token);
	if (locals.user) {
		const [member] = await db
			.select()
			.from(schema.memberships)
			.where(and(eq(schema.memberships.groupId, group.id), eq(schema.memberships.personId, locals.user.id)));
		if (member) redirect(303, `/gruppen/${group.id}`);
	}
	const open = await unclaimed(group.id);
	return {
		group: { id: group.id, name: group.name, emoji: group.emoji },
		people: open.map((m) => ({ personId: m.personId, name: m.name, color: m.color, avatarUrl: m.avatarUrl })),
		memberCount: (await loadMembers(group.id)).length
	};
};

async function joinAs(groupId: string, personId: string, actorId: string) {
	const kasseId = await pickKasseForGroup(personId, groupId, await personalKasseId(db, personId));
	await db.insert(schema.memberships).values({ groupId, personId, kasseId }).onConflictDoNothing();
	await audit(db, { groupId, personId: actorId, action: 'member.add', entityId: personId, data: { via: 'group-link' } });
}

export const actions: Actions = {
	/** Not logged in: "I am X" (a placeholder of the group). */
	claim: async ({ params, cookies, request, locals }) => {
		const { group } = await loadInvite(params.token);
		const personId = String((await request.formData()).get('personId'));
		const open = await unclaimed(group.id);
		if (!open.some((m) => m.personId === personId)) return fail(400, { message: 'Diese Person ist schon vergeben.' });
		if (locals.user) {
			// logged in elsewhere: the placeholder is me
			try {
				await mergePersons(personId, locals.user.id);
			} catch (e) {
				return fail(400, { message: (e as Error).message });
			}
			redirect(303, `/gruppen/${group.id}`);
		}
		await createSession(cookies, personId, false);
		redirect(303, `/willkommen?next=${encodeURIComponent(`/gruppen/${group.id}`)}`);
	},
	/** "I'm new here": creates a person (or adds the logged-in user) and joins. */
	join: async ({ params, cookies, request, locals }) => {
		const { group } = await loadInvite(params.token);
		if (locals.user) {
			await joinAs(group.id, locals.user.id, locals.user.id);
			redirect(303, `/gruppen/${group.id}`);
		}
		const name = nameFromForm(await request.formData());
		if (!name) return fail(400, { message: 'Bitte gib deinen Vornamen an.' });
		const twin = sameName(name, await loadMembers(group.id));
		if (twin) {
			return fail(400, { message: `„${twin.name}“ ist schon in der Gruppe. Bist du das? Dann wähle dich in der Liste – sonst ergänze deinen Nachnamen.` });
		}
		const personId = await createPerson(db, { name });
		await joinAs(group.id, personId, personId);
		await createSession(cookies, personId, false);
		redirect(303, `/willkommen?next=${encodeURIComponent(`/gruppen/${group.id}`)}`);
	}
};
