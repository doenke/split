import { error, fail } from '@sveltejs/kit';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db, schema } from '$lib/server/db';
import { loadMembers, requireGroup } from '$lib/server/groups';
import { claimedPersonIds, createPerson, knownPersons, personalKasseId } from '$lib/server/persons';
import { activeGroupInvite, createGroupInvite, createPersonalInvite, revokeGroupInvite } from '$lib/server/auth/invites';
import { pickKasseForGroup, sharedKassenOf, kasseMembersOf } from '$lib/server/kassen';
import { audit } from '$lib/server/audit';
import { today } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function canAddPeople(g: Awaited<ReturnType<typeof requireGroup>>) {
	return g.isAdmin || g.group.settings.membersCanAddPeople;
}

export const load: PageServerLoad = async ({ parent, locals, params }) => {
	const data = await parent();
	const g = await requireGroup(params.id, locals.user);
	const ids = data.members.map((m) => m.personId);
	const claimed = await claimedPersonIds(ids);
	const known = (await knownPersons(g.user.id)).filter((p) => !ids.includes(p.id));
	const kassenByPerson = Object.fromEntries(
		await Promise.all(ids.map(async (id) => [id, (await sharedKassenOf(id)).map((k) => ({ id: k.id, name: k.name }))] as const))
	);
	// my Kassen with members that are not in the group yet (to add a whole family at once)
	const myKassen = [];
	const mine = await sharedKassenOf(g.user.id);
	const managedKassen = mine.filter((k) => k.isManager).map((k) => k.id);
	for (const k of mine) {
		const missing = (await kasseMembersOf(k.id)).filter((m) => !ids.includes(m.personId));
		if (missing.length) myKassen.push({ id: k.id, name: k.name, missing: missing.map((m) => m.name) });
	}
	const groupLink = g.isAdmin ? await activeGroupInvite(params.id) : null;
	return {
		groupLink: groupLink
			? { ...groupLink, qr: await QRCode.toString(groupLink.url, { type: 'svg', margin: 1 }), expiresAt: groupLink.expiresAt.toISOString() }
			: null,
		claimed: [...claimed],
		known,
		kassenByPerson,
		myKassen,
		managedKassen,
		canAddPeople: canAddPeople(g)
	};
};

function parseTags(v: FormDataEntryValue | null): string[] {
	return [
		...new Set(
			String(v ?? '')
				.split(',')
				.map((t) => t.trim().slice(0, 30))
				.filter(Boolean)
		)
	].slice(0, 10);
}

function parseFactor(v: FormDataEntryValue | null) {
	const n = parseFloat(String(v ?? '1').replace(',', '.'));
	return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export const actions: Actions = {
	add: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!canAddPeople(g)) error(403, 'Du darfst keine Personen hinzufügen.');
		const f = await request.formData();
		const existingId = String(f.get('personId') ?? '');
		const name = String(f.get('name') ?? '').trim();
		const factor = parseFactor(f.get('factor'));
		if (factor === null) return fail(400, { message: 'Ungültiger Faktor.' });
		const join = String(f.get('join') ?? 'all');
		let from: string | null = null;
		if (join === 'today') from = today();
		if (join === 'date') {
			from = String(f.get('from') ?? '');
			if (!isDate(from)) return fail(400, { message: 'Bitte ein Datum angeben.' });
		}

		let personId: string;
		if (existingId) {
			const known = await knownPersons(g.user.id);
			if (!known.some((p) => p.id === existingId)) return fail(400, { message: 'Unbekannte Person.' });
			personId = existingId;
		} else {
			if (!name) return fail(400, { message: 'Bitte einen Namen angeben.' });
			personId = await createPerson(db, { name, createdBy: g.user.id });
		}
		const [already] = await db
			.select()
			.from(schema.memberships)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));
		if (already) return fail(400, { message: 'Diese Person ist schon Mitglied.' });

		const kasseId = await pickKasseForGroup(personId, params.id, await personalKasseId(db, personId));

		await db.insert(schema.memberships).values({
			groupId: params.id,
			personId,
			factor,
			tags: parseTags(f.get('tags')),
			participationFrom: from,
			kasseId
		});
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.add', entityId: personId, data: { from } });
		return { added: personId };
	},

	/** Adds all members of one of my Kassen that are not in the group yet. */
	addKasse: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!canAddPeople(g)) error(403, 'Du darfst keine Personen hinzufügen.');
		const f = await request.formData();
		const kasseId = String(f.get('kasseId'));
		if (!(await sharedKassenOf(g.user.id)).some((k) => k.id === kasseId)) error(404);
		const join = String(f.get('join') ?? 'all');
		const from = join === 'today' ? today() : join === 'date' && isDate(String(f.get('from'))) ? String(f.get('from')) : null;
		const current = new Set((await loadMembers(params.id)).map((m) => m.personId));
		const members = (await kasseMembersOf(kasseId)).filter((m) => !current.has(m.personId));
		for (const m of members) {
			await db.insert(schema.memberships).values({ groupId: params.id, personId: m.personId, participationFrom: from, kasseId });
			await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.add', entityId: m.personId, data: { from, kasseId } });
		}
		// members already in the group switch to the Kasse as well
		await db
			.update(schema.memberships)
			.set({ kasseId })
			.where(
				and(
					eq(schema.memberships.groupId, params.id),
					inArray(
						schema.memberships.personId,
						(await kasseMembersOf(kasseId)).map((m) => m.personId)
					),
					isNull(schema.memberships.participationTo)
				)
			);
		return { addedKasse: members.length };
	},

	update: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const f = await request.formData();
		const personId = String(f.get('personId'));
		const self = personId === g.user.id;
		// managers of a shared Kasse may edit its members (e.g. their kids)
		const targetKassen = new Set((await sharedKassenOf(personId)).map((k) => k.id));
		const managesPerson = (await sharedKassenOf(g.user.id)).some((k) => k.isManager && targetKassen.has(k.id));
		if (!g.isAdmin && !self && !managesPerson) error(403, 'Nur Gruppenadmins dürfen andere bearbeiten.');
		const factor = parseFactor(f.get('factor'));
		if (factor === null) return fail(400, { message: 'Ungültiger Faktor.' });
		const from = String(f.get('from') ?? '');
		const to = String(f.get('to') ?? '');
		if ((from && !isDate(from)) || (to && !isDate(to)) || (from && to && to < from)) {
			return fail(400, { message: 'Ungültiger Teilnahmezeitraum.' });
		}
		const values: Partial<typeof schema.memberships.$inferInsert> = {
			factor,
			tags: parseTags(f.get('tags')),
			participationFrom: from || null,
			participationTo: to || null
		};
		const personal = await personalKasseId(db, personId);
		const kasseId = f.get('kasseId') === 'personal' ? personal : String(f.get('kasseId') ?? '');
		if (kasseId) {
			const allowed = [personal, ...(await sharedKassenOf(personId)).map((k) => k.id)];
			if (!allowed.includes(kasseId)) return fail(400, { message: 'Die Person gehört dieser Kasse nicht an.' });
			values.kasseId = kasseId;
		}
		if (g.isAdmin && f.has('role')) {
			const role = f.get('role') === 'admin' ? 'admin' : 'member';
			if (role === 'member' && self) {
				const admins = (await loadMembers(params.id)).filter((m) => m.role === 'admin');
				if (admins.length <= 1) return fail(400, { message: 'Die Gruppe braucht mindestens einen Admin.' });
			}
			values.role = role;
		}
		await db
			.update(schema.memberships)
			.set(values)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));

		// names of placeholders (people who never logged in) can be fixed by admins
		const name = String(f.get('name') ?? '').trim();
		if (name && g.isAdmin) {
			const claimed = await claimedPersonIds([personId]);
			if (!claimed.has(personId) || self) {
				await db.update(schema.persons).set({ name }).where(eq(schema.persons.id, personId));
				await db.update(schema.kassen).set({ name }).where(eq(schema.kassen.personalOf, personId));
			}
		}
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.update', entityId: personId, data: values });
		return { updated: personId };
	},

	remove: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		const personId = String((await request.formData()).get('personId'));
		if (!g.isAdmin) error(403);
		const paid = await db
			.select({ id: schema.expensePayers.expenseId })
			.from(schema.expensePayers)
			.innerJoin(schema.expenses, eq(schema.expenses.id, schema.expensePayers.expenseId))
			.where(and(eq(schema.expenses.groupId, params.id), eq(schema.expensePayers.personId, personId), isNull(schema.expenses.deletedAt)))
			.limit(1);
		const [membership] = await db
			.select()
			.from(schema.memberships)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));
		if (!membership) error(404);
		const settled = await db
			.select({ id: schema.settlements.id })
			.from(schema.settlements)
			.where(
				and(
					eq(schema.settlements.groupId, params.id),
					isNull(schema.settlements.deletedAt),
					or(eq(schema.settlements.fromKasseId, membership.kasseId), eq(schema.settlements.toKasseId, membership.kasseId))
				)
			)
			.limit(1);
		if (paid.length || settled.length) {
			return fail(400, {
				message: 'Diese Person hat Ausgaben bezahlt oder Zahlungen. Setze stattdessen das Ende ihres Teilnahmezeitraums.'
			});
		}
		if (personId === g.user.id) return fail(400, { message: 'Du kannst dich nicht selbst entfernen.' });
		await db
			.delete(schema.memberships)
			.where(and(eq(schema.memberships.groupId, params.id), eq(schema.memberships.personId, personId)));
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'member.remove', entityId: personId });
		return { removed: personId };
	},

	groupLink: async ({ params, locals }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!g.isAdmin) error(403);
		await createGroupInvite(params.id, g.user.id);
		await audit(db, { groupId: params.id, personId: g.user.id, action: 'group.link' });
		return { groupLinkCreated: true };
	},
	revokeGroupLink: async ({ params, locals }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!g.isAdmin) error(403);
		await revokeGroupInvite(params.id);
		return { groupLinkRevoked: true };
	},

	invite: async ({ params, locals, request }) => {
		const g = await requireGroup(params.id, locals.user);
		if (!canAddPeople(g)) error(403);
		const personId = String((await request.formData()).get('personId'));
		const members = await loadMembers(params.id);
		if (!members.some((m) => m.personId === personId)) error(404);
		const claimed = await claimedPersonIds([personId]);
		if (claimed.has(personId) && !g.isAdmin) {
			return fail(400, { message: 'Diese Person ist bereits angemeldet. Nur Admins können einen neuen Link erzeugen.' });
		}
		const invite = await createPersonalInvite(personId, params.id, g.user.id);
		const qr = await QRCode.toString(invite.url, { type: 'svg', margin: 1, width: 220 });
		return { invite: { personId, url: invite.url, qr, expiresAt: invite.expiresAt.toISOString() } };
	}
};
