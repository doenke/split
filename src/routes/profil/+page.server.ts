import { fail, redirect } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
import QRCode from 'qrcode';
import { createPersonalInvite } from '$lib/server/auth/invites';
import { today } from '$lib/format';
import { formatIban, isValidIban, normalizeIban, normalizePaypalMe } from '$lib/core/payment';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const creds = await db
		.select({ id: schema.credentials.id, type: schema.credentials.type, label: schema.credentials.label, createdAt: schema.credentials.createdAt, lastUsedAt: schema.credentials.lastUsedAt })
		.from(schema.credentials)
		.where(eq(schema.credentials.personId, locals.user.id));
	const sessions = await db
		.select({ id: schema.sessions.id, createdAt: schema.sessions.createdAt })
		.from(schema.sessions)
		.where(and(eq(schema.sessions.personId, locals.user.id), gt(schema.sessions.expiresAt, new Date())));
	const [payment] = await db.select().from(schema.paymentDetails).where(eq(schema.paymentDetails.personId, locals.user.id));
	return {
		payment: payment ? { ...payment, iban: payment.iban ? formatIban(payment.iban) : null } : null,
		today: today(),
		passkeys: creds.filter((c) => c.type === 'passkey'),
		hasOidc: creds.some((c) => c.type === 'oidc'),
		sessionCount: sessions.length,
		oidcEnabled: config.oidc.enabled,
		oidcLabel: config.oidc.buttonLabel
	};
};

export const actions: Actions = {
	rename: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		if (locals.user.isOidc) return fail(400, { message: 'Dein Name kommt von deinem Login-Anbieter.' });
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name fehlt.' });
		await db.update(schema.persons).set({ name }).where(eq(schema.persons.id, locals.user.id));
		await db.update(schema.kassen).set({ name }).where(eq(schema.kassen.personalOf, locals.user.id));
		return { saved: true };
	},
	savePayment: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const f = await request.formData();
		const str = (k: string) => String(f.get(k) ?? '').trim();
		const iban = str('iban');
		if (iban && !isValidIban(iban)) return fail(400, { paymentError: 'Die IBAN ist ungültig.' });
		const paypalRaw = str('paypalMe');
		const paypalMe = paypalRaw ? normalizePaypalMe(paypalRaw) : null;
		if (paypalRaw && !paypalMe) return fail(400, { paymentError: 'Bitte nur deinen PayPal.me-Namen oder -Link angeben.' });
		const weroLink = str('weroLink');
		if (weroLink && !/^https:\/\//.test(weroLink)) return fail(400, { paymentError: 'Der Wero-Link muss mit https:// beginnen.' });
		// empty = the link does not expire (e.g. a permanent personal QR code)
		const weroLinkExpires = str('weroLinkExpires');
		if (weroLinkExpires && !/^\d{4}-\d{2}-\d{2}$/.test(weroLinkExpires)) return fail(400, { paymentError: 'Ungültiges Ablaufdatum.' });
		const values = {
			weroContact: str('weroContact') || null,
			weroLink: weroLink || null,
			weroLinkExpires: (weroLink && weroLinkExpires) || null,
			iban: iban ? normalizeIban(iban) : null,
			accountHolder: str('accountHolder') || (iban ? locals.user.name : null),
			paypalMe,
			updatedAt: new Date()
		};
		await db
			.insert(schema.paymentDetails)
			.values({ personId: locals.user.id, ...values })
			.onConflictDoUpdate({ target: schema.paymentDetails.personId, set: values });
		return { paymentSaved: true };
	},
	deletePasskey: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const id = String((await request.formData()).get('id'));
		await db
			.delete(schema.credentials)
			.where(and(eq(schema.credentials.id, id), eq(schema.credentials.personId, locals.user.id), eq(schema.credentials.type, 'passkey')));
		return { deleted: true };
	},
	/** Short-lived login link for another device of the same person. */
	pairDevice: async ({ locals }) => {
		if (!locals.user) redirect(303, '/login');
		const { url } = await createPersonalInvite(locals.user.id, null, locals.user.id, 10);
		return { pairing: { url, qr: await QRCode.toString(url, { type: 'svg', margin: 1 }) } };
	},
	logoutOthers: async ({ locals }) => {
		if (!locals.user) redirect(303, '/login');
		const all = await db.select({ id: schema.sessions.id }).from(schema.sessions).where(eq(schema.sessions.personId, locals.user.id));
		for (const s of all) {
			if (s.id !== locals.sessionId) await db.delete(schema.sessions).where(eq(schema.sessions.id, s.id));
		}
		return { loggedOut: true };
	}
};
