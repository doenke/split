import { fail, redirect } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/config';
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
	return {
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
	deletePasskey: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const id = String((await request.formData()).get('id'));
		await db
			.delete(schema.credentials)
			.where(and(eq(schema.credentials.id, id), eq(schema.credentials.personId, locals.user.id), eq(schema.credentials.type, 'passkey')));
		return { deleted: true };
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
