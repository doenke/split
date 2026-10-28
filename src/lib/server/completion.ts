import { and, eq, inArray } from 'drizzle-orm';
import { formatAmount } from '$lib/core/currency';
import { today } from '$lib/format';
import { db, schema } from './db';
import { audit } from './audit';
import { closeUntil } from './closing';
import { loadExpenses, loadGroupState, type GroupMember } from './groups';
import { claimedPersonIds } from './persons';
import { kasseRecipients, notify } from './push';

/**
 * Who has to report "done" before the final statement stands: everyone who can log in,
 * plus everyone in a shared Kasse (they are reported by their Kasse). People without login
 * in their own Kasse (e.g. a grandma without phone) cannot report and do not block.
 */
export async function completionState(members: GroupMember[], group: { status: string }) {
	const claimed = await claimedPersonIds(members.map((m) => m.personId));
	const required = members.filter((m) => claimed.has(m.personId) || !m.kassePersonal);
	return {
		required: required.map((m) => m.personId),
		done: required.filter((m) => m.doneAt).map((m) => m.personId),
		final: group.status === 'settled'
	};
}

export type DoneScope = { type: 'self' } | { type: 'kasse' } | { type: 'person'; personId: string } | { type: 'all' };

/**
 * Marks people as done: the user, everyone of their Kasse in this group, or – for admins –
 * any single person or everybody.
 */
export async function markDone(groupId: string, user: { id: string }, kasseId: string, scope: DoneScope, done: boolean) {
	const inGroup = eq(schema.memberships.groupId, groupId);
	const where =
		scope.type === 'kasse'
			? and(inGroup, eq(schema.memberships.kasseId, kasseId))
			: scope.type === 'person'
				? and(inGroup, eq(schema.memberships.personId, scope.personId))
				: scope.type === 'all'
					? inGroup
					: and(inGroup, eq(schema.memberships.personId, user.id));
	await db
		.update(schema.memberships)
		.set(done ? { doneAt: new Date(), doneBy: user.id } : { doneAt: null, doneBy: null })
		.where(where);
}

/** When everyone is done: freeze all expenses, mark the group settled and tell everyone what to pay. */
export async function finalizeIfComplete(groupId: string, actorId: string) {
	const state = await loadGroupState(groupId);
	if (state.group.status === 'settled') return false;
	const c = await completionState(state.members, state.group);
	if (!c.required.length || c.done.length < c.required.length) return false;
	// prepared expenses would silently be left out of the final statement
	if ((await loadExpenses(groupId, 'draft')).length) return false;

	const lastDate = state.expenses.reduce((max, e) => (e.date > max ? e.date : max), today());
	await closeUntil(groupId, lastDate);
	await db.update(schema.groups).set({ status: 'settled' }).where(eq(schema.groups.id, groupId));
	await audit(db, { groupId, personId: actorId, action: 'group.final' });

	// everyone learns their part of the final statement
	const fresh = await loadGroupState(groupId);
	const names = new Map(fresh.kassen.map((k) => [k.id, k.name]));
	const title = `${fresh.group.emoji} ${fresh.group.name}: Endabrechnung steht`;
	const url = `/gruppen/${groupId}/salden`;
	const cur = fresh.group.baseCurrency;
	for (const kasseId of new Set(fresh.members.map((m) => m.kasseId))) {
		const out = fresh.transfers.filter((t) => t.from === kasseId);
		const inc = fresh.transfers.filter((t) => t.to === kasseId);
		const body = out.length
			? out.map((t) => `Bitte ${formatAmount(t.amount, cur)} an ${names.get(t.to)} zahlen.`).join(' ')
			: inc.length
				? `Du bekommst ${inc.map((t) => `${formatAmount(t.amount, cur)} von ${names.get(t.from)}`).join(', ')}.`
				: 'Bei euch ist alles ausgeglichen.';
		void kasseRecipients(groupId, kasseId, null).then((ids) => notify(ids, { title, body, url, tag: `final-${groupId}` }));
	}
	return true;
}

/** Reopens a final statement: everyone has to report "done" again. */
export async function resetCompletion(groupId: string) {
	await db.update(schema.memberships).set({ doneAt: null, doneBy: null }).where(eq(schema.memberships.groupId, groupId));
	await db.update(schema.groups).set({ status: 'active' }).where(and(eq(schema.groups.id, groupId), inArray(schema.groups.status, ['settled'])));
}
