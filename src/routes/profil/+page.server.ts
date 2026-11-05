import { fail, redirect } from '@sveltejs/kit';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { displayNameFree } from '$lib/core/display-names';
import { refreshDisplayNames, shownName } from '$lib/server/display';
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
import { deleteAvatar, storeAvatar, UploadError } from '$lib/server/uploads';
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
	const [me] = await db.select({ displayName: schema.persons.displayName }).from(schema.persons).where(eq(schema.persons.id, locals.user.id));
	return {
		displayName: me?.displayName ?? '',
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
	/** Own profile picture (already made small and square on the device). */
	avatar: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const file = (await request.formData()).get('avatar');
		if (!(file instanceof File) || !file.size) return fail(400, { message: 'Bitte ein Bild wählen.' });
		const [me] = await db.select({ url: schema.persons.avatarUrl }).from(schema.persons).where(eq(schema.persons.id, locals.user.id));
		try {
			const url = await storeAvatar(file, locals.user.id, me?.url ?? null);
			await db.update(schema.persons).set({ avatarUrl: url }).where(eq(schema.persons.id, locals.user.id));
		} catch (e) {
			if (e instanceof UploadError) return fail(400, { message: e.message });
			throw e;
		}
		return { avatarSaved: true };
	},
	removeAvatar: async ({ locals }) => {
		if (!locals.user) redirect(303, '/login');
		const [me] = await db.select({ url: schema.persons.avatarUrl }).from(schema.persons).where(eq(schema.persons.id, locals.user.id));
		await deleteAvatar(me?.url ?? null);
		await db.update(schema.persons).set({ avatarUrl: null }).where(eq(schema.persons.id, locals.user.id));
		return { avatarRemoved: true };
	},
	/** Full name (not for login-provider accounts) and the optional display name. */
	rename: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const f = await request.formData();
		const values: { name?: string; displayName: string | null } = { displayName: null };
		if (!locals.user.isOidc && f.has('name')) {
			const name = String(f.get('name') ?? '').trim().replace(/\s+/g, ' ');
			if (!name) return fail(400, { message: 'Name fehlt.' });
			values.name = name;
		}
		const wanted = String(f.get('displayName') ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
		if (wanted) {
			const others = await db
				.select({ id: schema.persons.id, name: schema.persons.name, display: shownName })
				.from(schema.persons)
				.where(isNull(schema.persons.mergedInto));
			if (!displayNameFree(wanted, locals.user.id, others)) return fail(400, { message: `„${wanted}“ gibt es schon. Bitte wähle einen anderen Anzeigenamen.` });
			values.displayName = wanted;
		}
		await db.update(schema.persons).set(values).where(eq(schema.persons.id, locals.user.id));
		await refreshDisplayNames();
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
			accountHolder: str('accountHolder') || (iban ? locals.user.fullName : null),
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
		if (person.emailFromOidc) return fail(400, { mailError: `Deine Adresse kommt von ${config.oidc.providerName}.` });
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
