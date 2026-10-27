import {
	generateAuthenticationOptions,
	generateRegistrationOptions,
	verifyAuthenticationResponse,
	verifyRegistrationResponse,
	type AuthenticationResponseJSON,
	type AuthenticatorTransportFuture,
	type RegistrationResponseJSON
} from '@simplewebauthn/server';
import type { Cookies } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { config } from '../config';
import { db, schema } from '../db';
import { newId } from '../ids';

const CHALLENGE_COOKIE = 'split_webauthn';

function storeChallenge(cookies: Cookies, challenge: string) {
	cookies.set(CHALLENGE_COOKIE, challenge, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: config.secureCookies,
		maxAge: 300
	});
}

function takeChallenge(cookies: Cookies) {
	const c = cookies.get(CHALLENGE_COOKIE);
	cookies.delete(CHALLENGE_COOKIE, { path: '/' });
	if (!c) throw new Error('Die Anfrage ist abgelaufen. Bitte erneut versuchen.');
	return c;
}

async function passkeysOf(personId: string) {
	return db
		.select()
		.from(schema.credentials)
		.where(and(eq(schema.credentials.personId, personId), eq(schema.credentials.type, 'passkey')));
}

export async function registrationOptions(cookies: Cookies, person: { id: string; name: string }) {
	const existing = await passkeysOf(person.id);
	const options = await generateRegistrationOptions({
		rpName: config.webauthn.rpName,
		rpID: config.webauthn.rpId,
		userName: person.name,
		userDisplayName: person.name,
		userID: new TextEncoder().encode(person.id),
		attestationType: 'none',
		excludeCredentials: existing.map((c) => ({
			id: c.subject,
			transports: (c.transports?.split(',') ?? []) as AuthenticatorTransportFuture[]
		})),
		authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
	});
	storeChallenge(cookies, options.challenge);
	return options;
}

export async function verifyRegistration(
	cookies: Cookies,
	personId: string,
	response: RegistrationResponseJSON,
	label: string | null
) {
	const verification = await verifyRegistrationResponse({
		response,
		expectedChallenge: takeChallenge(cookies),
		expectedOrigin: config.webauthn.origin,
		expectedRPID: config.webauthn.rpId
	});
	if (!verification.verified || !verification.registrationInfo) throw new Error('Passkey konnte nicht geprüft werden.');
	const { credential } = verification.registrationInfo;
	await db.insert(schema.credentials).values({
		id: newId(),
		personId,
		type: 'passkey',
		subject: credential.id,
		publicKey: Buffer.from(credential.publicKey).toString('base64url'),
		counter: credential.counter,
		transports: credential.transports?.join(',') ?? null,
		label
	});
}

export async function authenticationOptions(cookies: Cookies) {
	const options = await generateAuthenticationOptions({
		rpID: config.webauthn.rpId,
		userVerification: 'preferred'
	});
	storeChallenge(cookies, options.challenge);
	return options;
}

/** Returns the person id of a successful passkey login. */
export async function verifyAuthentication(cookies: Cookies, response: AuthenticationResponseJSON) {
	const expectedChallenge = takeChallenge(cookies);
	const [cred] = await db
		.select()
		.from(schema.credentials)
		.where(and(eq(schema.credentials.type, 'passkey'), eq(schema.credentials.subject, response.id)))
		.limit(1);
	if (!cred || !cred.publicKey) throw new Error('Dieser Passkey ist nicht (mehr) bekannt.');
	const verification = await verifyAuthenticationResponse({
		response,
		expectedChallenge,
		expectedOrigin: config.webauthn.origin,
		expectedRPID: config.webauthn.rpId,
		credential: {
			id: cred.subject,
			publicKey: new Uint8Array(Buffer.from(cred.publicKey, 'base64url')),
			counter: cred.counter ?? 0,
			transports: (cred.transports?.split(',') ?? []) as AuthenticatorTransportFuture[]
		}
	});
	if (!verification.verified) throw new Error('Anmeldung mit Passkey fehlgeschlagen.');
	await db
		.update(schema.credentials)
		.set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() })
		.where(eq(schema.credentials.id, cred.id));
	return cred.personId;
}
