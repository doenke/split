import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '../db';
import { hashToken, newToken } from '../ids';
import { config } from '../config';

export const SESSION_COOKIE = 'split_session';
const SESSION_DAYS = 365;

export interface SessionUser {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	color: string;
	/** Logged in via OIDC: may create groups. */
	isOidc: boolean;
	isInstanceAdmin: boolean;
}

export async function createSession(cookies: Cookies, personId: string, isOidc: boolean) {
	const token = newToken();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
	await db.insert(schema.sessions).values({ id: hashToken(token), personId, isOidc, expiresAt });
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: config.secureCookies,
		expires: expiresAt
	});
}

export async function validateSession(token: string | undefined) {
	if (!token) return null;
	const id = hashToken(token);
	const rows = await db
		.select({ session: schema.sessions, person: schema.persons })
		.from(schema.sessions)
		.innerJoin(schema.persons, eq(schema.persons.id, schema.sessions.personId))
		.where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	const { person, session } = row;
	// person was merged into another one: follow it
	if (person.mergedInto) {
		await db.update(schema.sessions).set({ personId: person.mergedInto }).where(eq(schema.sessions.id, id));
		return validateSession(token);
	}
	const oidc = await db
		.select({ id: schema.credentials.id })
		.from(schema.credentials)
		.where(and(eq(schema.credentials.personId, person.id), eq(schema.credentials.type, 'oidc')))
		.limit(1);
	const user: SessionUser = {
		id: person.id,
		name: person.name,
		email: person.email,
		avatarUrl: person.avatarUrl,
		color: person.color,
		isOidc: session.isOidc || oidc.length > 0,
		isInstanceAdmin: person.isAdmin
	};
	return { sessionId: id, user };
}

export async function destroySession(cookies: Cookies, sessionId: string | null) {
	if (sessionId) await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
