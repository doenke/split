import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/audit';
import { requireGroup } from '$lib/server/groups';
import { finalizeIfComplete, markDone, type DoneScope } from '$lib/server/completion';
import type { Actions } from './$types';

async function setDone(params: { id: string }, locals: App.Locals, request: Request, done: boolean) {
	const g = await requireGroup(params.id, locals.user);
	if (g.group.status === 'settled') {
		return fail(400, { message: 'Die Endabrechnung steht bereits. Ein Gruppenadmin kann sie in den Einstellungen wieder öffnen.' });
	}
	const f = await request.formData();
	const kind = String(f.get('scope'));
	let scope: DoneScope;
	if (kind === 'kasse') scope = { type: 'kasse' };
	else if (kind === 'all' || kind === 'person') {
		// admins may report for anybody, e.g. people who never log in
		if (!g.isAdmin) error(403, 'Nur Gruppenadmins dürfen andere abschließen.');
		scope = kind === 'all' ? { type: 'all' } : { type: 'person', personId: String(f.get('personId')) };
	} else scope = { type: 'self' };
	await markDone(params.id, g.user, g.membership.kasseId, scope, done);
	await audit(db, {
		groupId: params.id,
		personId: g.user.id,
		action: done ? 'member.done' : 'member.undone',
		entityId: scope.type === 'person' ? scope.personId : undefined,
		data: { scope: scope.type }
	});
	const final = done ? await finalizeIfComplete(params.id, g.user.id) : false;
	return { final };
}

export const actions: Actions = {
	done: ({ params, locals, request }) => setDone(params, locals, request, true),
	undone: ({ params, locals, request }) => setDone(params, locals, request, false)
};
