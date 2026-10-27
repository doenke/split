import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/audit';
import { requireGroup } from '$lib/server/groups';
import { finalizeIfComplete, markDone } from '$lib/server/completion';
import type { Actions } from './$types';

async function setDone(params: { id: string }, locals: App.Locals, request: Request, done: boolean) {
	const g = await requireGroup(params.id, locals.user);
	if (g.group.status === 'settled') {
		return fail(400, { message: 'Die Endabrechnung steht bereits. Ein Gruppenadmin kann sie in den Einstellungen wieder öffnen.' });
	}
	const scope = (await request.formData()).get('scope') === 'kasse' ? 'kasse' : 'self';
	await markDone(params.id, g.user, g.membership.kasseId, scope, done);
	await audit(db, { groupId: params.id, personId: g.user.id, action: done ? 'member.done' : 'member.undone', data: { scope } });
	const final = done ? await finalizeIfComplete(params.id, g.user.id) : false;
	return { final };
}

export const actions: Actions = {
	done: ({ params, locals, request }) => setDone(params, locals, request, true),
	undone: ({ params, locals, request }) => setDone(params, locals, request, false)
};
