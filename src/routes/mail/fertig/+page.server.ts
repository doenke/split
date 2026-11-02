import { fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { audit } from '$lib/server/audit';
import { loadExpenses } from '$lib/server/groups';
import { finalizeIfComplete, markDone } from '$lib/server/completion';
import { verifyToken } from '$lib/server/mail';
import type { Actions, PageServerLoad } from './$types';

/** "I'm done" from the reminder e-mail: works without logging in, the signed token says who and which group. */
async function parse(token: string) {
	const parts = await verifyToken(token);
	if (!parts || parts[0] !== 'done') return null;
	const [row] = await db
		.select({ group: schema.groups, membership: schema.memberships, name: schema.persons.name })
		.from(schema.memberships)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
		.innerJoin(schema.persons, eq(schema.persons.id, schema.memberships.personId))
		.where(and(eq(schema.memberships.personId, parts[1]), eq(schema.memberships.groupId, parts[2]), isNull(schema.groups.deletedAt)));
	return row ?? null;
}

export const load: PageServerLoad = async ({ url }) => {
	const t = url.searchParams.get('t') ?? '';
	const row = await parse(t);
	if (!row) return { token: null };
	return {
		token: t,
		group: { id: row.group.id, name: row.group.name, emoji: row.group.emoji },
		name: row.name,
		alreadyDone: Boolean(row.membership.doneAt),
		final: row.group.status === 'settled'
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const row = await parse(String((await request.formData()).get('t') ?? ''));
		if (!row) return fail(400, { message: 'Der Link ist ungültig.' });
		if (row.group.status === 'settled') return { done: true, final: true };
		const person = row.membership.personId;
		const mine = (await loadExpenses(row.group.id, 'draft')).filter((d) => d.createdBy === person);
		if (mine.length) {
			return fail(400, { message: `Du hast noch ${mine.length} vorbereitete Ausgabe(n). Bitte erst in der App vervollständigen oder löschen.` });
		}
		await markDone(row.group.id, { id: person }, row.membership.kasseId, { type: 'self' }, true);
		await audit(db, { groupId: row.group.id, personId: person, action: 'member.done', data: { scope: 'self', via: 'mail' } });
		const final = await finalizeIfComplete(row.group.id, person);
		return { done: true, final };
	}
};
