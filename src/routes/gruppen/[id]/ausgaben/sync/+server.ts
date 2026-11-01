import { json } from '@sveltejs/kit';
import { isClosed } from '$lib/server/closing';
import { announceExpense, InputError, prepareExpense, saveExpense } from '$lib/server/expenses';
import { loadMembers, loadProfiles, requireGroup } from '$lib/server/groups';
import type { RequestHandler } from './$types';

/** Receives expenses captured offline. Idempotent thanks to the client id. */
export const POST: RequestHandler = async ({ params, locals, request }) => {
	const g = await requireGroup(params.id, locals.user);
	const payload = await request.json();
	if (!payload?.clientId) return json({ message: 'clientId fehlt' }, { status: 400 });
	const [members, profiles] = await Promise.all([loadMembers(params.id), loadProfiles(params.id)]);
	try {
		const prepared = await prepareExpense(payload, g.group, members, profiles);
		if (isClosed(g.group, prepared.row.date)) {
			return json({ message: `Die Abrechnung ist bis ${g.group.closedUntil} abgeschlossen.` }, { status: 409 });
		}
		const id = await saveExpense(params.id, g.user.id, prepared);
		announceExpense(g.group, g.user, prepared.row, id);
		return json({ id });
	} catch (e) {
		if (e instanceof InputError) return json({ message: e.message }, { status: 422 });
		throw e;
	}
};
