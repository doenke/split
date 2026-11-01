import { fail, redirect } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
import QRCode from 'qrcode';
import { createPairingInvite } from '$lib/server/auth/invites';
import { createApiToken, listApiTokens, revokeApiToken } from '$lib/server/auth/apitokens';
import { effectivePrefs, mailKinds, sendConfirmation, smtpConfigured } from '$lib/server/mail';

/** E-mail address, whether it is confirmed and which mails the person gets. */
async function mailSettings(personId: string) {
	const [p] = await db
		.select({ email: schema.persons.email, verified: schema.persons.emailVerified, fromOidc: schema.persons.emailFromOidc, prefs: schema.persons.mailPrefs })
		.from(schema.persons)
		.where(eq(schema.persons.id, personId));
	return {
		enabled: smtpConfigured(),
		email: p.email,
		verified: p.verified,
		// addresses from the login provider are taken from there at every login
		fromOidc: p.fromOidc && Boolean(p.email),
		none: p.prefs.all === false,
		prefs: effectivePrefs({ ...p.prefs, all: true }),
		kinds: mailKinds.map((k) => ({ key: k.key, label: k.label, default: k.default }))
	};
}
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
		passkeys: creds.filter((c) => c.type === 'passkey'),
		hasOidc: creds.some((c) => c.type === 'oidc'),
		sessionCount: sessions.length,
		oidcEnabled: config.oidc.enabled,
		oidcLabel: config.oidc.buttonLabel,
		mail: await mailSettings(locals.user.id),
		apiKeys: (await listApiTokens(locals.user.id)).map((k) => ({ ...k, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null })),
		mcpUrl: `${config.publicUrl}/mcp`
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
		const values = {
			weroContact: str('weroContact') || null,
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
	/** Own e-mail address (people without OIDC); it has to be confirmed before mails go there. */
	saveEmail: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const [person] = await db.select().from(schema.persons).where(eq(schema.persons.id, locals.user.id));
		if (person.emailFromOidc) return fail(400, { mailError: 'Deine Adresse kommt von deinem Login-Anbieter.' });
		const email = String((await request.formData()).get('email') ?? '').trim().toLowerCase();
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { mailError: 'Das sieht nicht nach einer E-Mail-Adresse aus.' });
		if (email === (person.email ?? '')) return { mailSaved: true };
		await db.update(schema.persons).set({ email: email || null, emailVerified: false, emailFromOidc: false }).where(eq(schema.persons.id, person.id));
		if (email) await sendConfirmation(person.id, person.name, email);
		return { mailSaved: true, confirmationSent: Boolean(email) };
	},
	resendConfirmation: async ({ locals }) => {
		if (!locals.user) redirect(303, '/login');
		const [person] = await db.select().from(schema.persons).where(eq(schema.persons.id, locals.user.id));
		if (!person.email || person.emailVerified) return { mailSaved: true };
		await sendConfirmation(person.id, person.name, person.email);
		return { confirmationSent: true };
	},
	saveMailPrefs: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const f = await request.formData();
		const prefs: Record<string, boolean> = { all: f.get('none') !== 'on' };
		for (const k of mailKinds) prefs[k.key] = f.get(k.key) === 'on';
		await db.update(schema.persons).set({ mailPrefs: prefs }).where(eq(schema.persons.id, locals.user.id));
		return { prefsSaved: true };
	},
	/** Key for an AI assistant (MCP); shown only once. */
	createApiKey: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const label = String((await request.formData()).get('label') ?? '').trim();
		return { apiKey: await createApiToken(locals.user.id, label || 'KI-Assistent') };
	},
	revokeApiKey: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		await revokeApiToken(locals.user.id, String((await request.formData()).get('id')));
		return { revoked: true };
	},
	/** Short-lived login link for another device of the same person. */
	pairDevice: async ({ locals }) => {
		if (!locals.user) redirect(303, '/login');
		const { url } = await createPairingInvite(locals.user.id);
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
