import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { newId } from '$lib/server/ids';
import { audit } from '$lib/server/audit';
import { createPerson, knownPersons, nameFromForm, personalKasseId, sameName } from '$lib/server/persons';
import { kasseOverview, requireKasse, syncKasseToGroups } from '$lib/server/kassen';
import { groupCosts } from '$lib/server/costs';
import { defaultCategories } from '$lib/server/defaults';
import { today } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const k = await requireKasse(params.id, locals.user);
	const ids = new Set(k.members.map((m) => m.personId));
	const [overview, known] = await Promise.all([kasseOverview(params.id), knownPersons(k.user.id)]);
	const costs = await Promise.all(
		overview.groups.map(async (g) => {
			const c = await groupCosts(g.id);
			const year = (c.group.startDate ?? c.group.createdAt.toISOString()).slice(0, 4);
			return { groupId: g.id, year, currency: g.currency, totals: c.kassen[params.id] ?? {} };
		})
	);
	const categories = await db.select().from(schema.categories);
	return {
		costs,
		categories: categories.length ? categories : defaultCategories,
		kasse: k.kasse,
		members: k.members,
		isManager: k.isManager,
		known: known.filter((p) => !ids.has(p.id)),
		...overview
	};
};

async function requireManager(id: string, user: App.Locals['user']) {
	const k = await requireKasse(id, user);
	if (!k.isManager) error(403, 'Nur Verwalter der Kasse dürfen das.');
	return k;
}

export const actions: Actions = {
	rename: async ({ params, locals, request }) => {
		await requireManager(params.id, locals.user);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name fehlt.' });
		await db.update(schema.kassen).set({ name }).where(eq(schema.kassen.id, params.id));
		return { saved: true };
	},

	addMember: async ({ params, locals, request }) => {
		const k = await requireManager(params.id, locals.user);
		const f = await request.formData();
		const existingId = String(f.get('personId') ?? '');
		const name = nameFromForm(f);
		let personId: string;
		if (existingId) {
			const known = await knownPersons(k.user.id);
			if (!known.some((p) => p.id === existingId)) return fail(400, { message: 'Unbekannte Person.' });
			personId = existingId;
		} else {
			if (!name) return fail(400, { message: 'Bitte einen Vornamen angeben.' });
			const twin = sameName(name, [...k.members, ...(await knownPersons(k.user.id))]);
			if (twin) return fail(400, { message: `„${twin.name}“ gibt es schon. Wähle die Person unter „Bekannte Person“ oder ergänze den Nachnamen.` });
			personId = await createPerson(db, { name, createdBy: k.user.id });
		}
		if (k.members.some((m) => m.personId === personId)) return fail(400, { message: 'Schon Mitglied.' });
		// the first person of a Kasse set up for others manages it and receives its payments
		const first = k.members.length === 0;
		await db.insert(schema.kasseMembers).values({ kasseId: params.id, personId, isManager: first });
		if (!k.kasse.receiverPersonId) await db.update(schema.kassen).set({ receiverPersonId: personId }).where(eq(schema.kassen.id, params.id));

		// open groups with at least two people of this Kasse now settle with it
		const switched = await syncKasseToGroups(params.id);
		return { added: true, switched };
	},

	removeMember: async ({ params, locals, request }) => {
		const personId = String((await request.formData()).get('personId'));
		const k = await requireKasse(params.id, locals.user);
		const self = personId === k.user.id;
		if (!self && !k.isManager) error(403);
		const target = k.members.find((m) => m.personId === personId);
		if (!target) error(404);
		const managersLeft = k.members.filter((m) => m.isManager && m.personId !== personId);
		if (target.isManager && managersLeft.length === 0 && k.members.length > 1) {
			return fail(400, { message: 'Ernenne zuerst einen anderen Verwalter.' });
		}
		const personal = await personalKasseId(db, personId);
		await db
			.update(schema.memberships)
			.set({ kasseId: personal })
			.where(and(eq(schema.memberships.personId, personId), eq(schema.memberships.kasseId, params.id)));
		await db
			.delete(schema.kasseMembers)
			.where(and(eq(schema.kasseMembers.kasseId, params.id), eq(schema.kasseMembers.personId, personId)));
		if (k.kasse.receiverPersonId === personId) {
			await db
				.update(schema.kassen)
				.set({ receiverPersonId: managersLeft[0]?.personId ?? null })
				.where(eq(schema.kassen.id, params.id));
		}
		if (self) redirect(303, '/kassen');
		return { removed: true };
	},

	toggleManager: async ({ params, locals, request }) => {
		const k = await requireManager(params.id, locals.user);
		const personId = String((await request.formData()).get('personId'));
		const target = k.members.find((m) => m.personId === personId);
		if (!target) error(404);
		if (target.isManager && k.members.filter((m) => m.isManager).length <= 1) {
			return fail(400, { message: 'Die Kasse braucht mindestens einen Verwalter.' });
		}
		await db
			.update(schema.kasseMembers)
			.set({ isManager: !target.isManager })
			.where(and(eq(schema.kasseMembers.kasseId, params.id), eq(schema.kasseMembers.personId, personId)));
		return { saved: true };
	},

	setPreferred: async ({ params, locals }) => {
		const k = await requireKasse(params.id, locals.user);
		const me = k.members.find((m) => m.personId === k.user.id)!;
		await db.update(schema.kasseMembers).set({ isPreferred: false }).where(eq(schema.kasseMembers.personId, k.user.id));
		if (!me.isPreferred) {
			await db
				.update(schema.kasseMembers)
				.set({ isPreferred: true })
				.where(and(eq(schema.kasseMembers.kasseId, params.id), eq(schema.kasseMembers.personId, k.user.id)));
		}
		return { saved: true };
	},

	setReceiver: async ({ params, locals, request }) => {
		const k = await requireManager(params.id, locals.user);
		const personId = String((await request.formData()).get('personId'));
		if (!k.members.some((m) => m.personId === personId)) error(404);
		await db.update(schema.kassen).set({ receiverPersonId: personId }).where(eq(schema.kassen.id, params.id));
		return { saved: true };
	},

	/** Records one netted payment as linked settlements in every involved group. */
	settleNet: async ({ params, locals, request }) => {
		const k = await requireKasse(params.id, locals.user);
		const f = await request.formData();
		const other = String(f.get('kasseId'));
		const currency = String(f.get('currency'));
		const method = (['cash', 'transfer', 'paypal', 'wero', 'other'] as const).find((m) => m === f.get('method')) ?? 'other';
		const overview = await kasseOverview(params.id);
		const entry = overview.netting.find((n) => n.kasseId === other && n.currency === currency);
		if (!entry) return fail(400, { message: 'Die Verrechnung ist nicht mehr aktuell. Bitte neu laden.' });
		const linkId = newId();
		// the net receiver recording it confirms it right away
		const confirmed = entry.amount > 0;
		await db.transaction(async (tx) => {
			for (const part of entry.parts) {
				const id = newId();
				await tx.insert(schema.settlements).values({
					id,
					groupId: part.groupId,
					fromKasseId: part.amount > 0 ? other : params.id,
					toKasseId: part.amount > 0 ? params.id : other,
					amount: Math.abs(part.amount),
					method,
					status: confirmed ? 'confirmed' : 'pending',
					confirmedAt: confirmed ? new Date() : null,
					linkId,
					date: today(),
					createdBy: k.user.id
				});
				await audit(tx, { groupId: part.groupId, personId: k.user.id, action: 'settlement.create', entityId: id, data: { linkId } });
			}
		});
		return { settled: true };
	},

	delete: async ({ params, locals }) => {
		await requireManager(params.id, locals.user);
		const used = await db
			.select({ g: schema.memberships.groupId })
			.from(schema.memberships)
			.where(eq(schema.memberships.kasseId, params.id))
			.limit(1);
		const settled = await db
			.select({ id: schema.settlements.id })
			.from(schema.settlements)
			.where(or(eq(schema.settlements.fromKasseId, params.id), eq(schema.settlements.toKasseId, params.id)))
			.limit(1);
		if (used.length || settled.length) {
			return fail(400, { message: 'Die Kasse wird noch in Gruppen verwendet und kann nicht gelöscht werden.' });
		}
		await db.delete(schema.kassen).where(eq(schema.kassen.id, params.id));
		redirect(303, '/kassen');
	}
};
