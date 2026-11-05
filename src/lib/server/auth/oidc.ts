import * as client from 'openid-client';
import { and, eq, isNull, like, not, or } from 'drizzle-orm';
import { config } from '../config';
import { db, schema } from '../db';
import { createPerson } from '../persons';
import { refreshDisplayNames } from '../display';

let configPromise: Promise<client.Configuration> | null = null;

function oidcConfig() {
	if (!config.oidc.enabled) throw new Error('OIDC ist nicht konfiguriert.');
	configPromise ??= client
		.discovery(new URL(config.oidc.issuer!), config.oidc.clientId!, config.oidc.clientSecret)
		.catch((e) => {
			configPromise = null;
			throw e;
		});
	return configPromise;
}

export const redirectUri = () => `${config.publicUrl}/auth/oidc/callback`;

export async function buildLoginUrl() {
	const cfg = await oidcConfig();
	const verifier = client.randomPKCECodeVerifier();
	const state = client.randomState();
	const url = client.buildAuthorizationUrl(cfg, {
		redirect_uri: redirectUri(),
		scope: config.oidc.scopes,
		code_challenge: await client.calculatePKCECodeChallenge(verifier),
		code_challenge_method: 'S256',
		state
	});
	return { url, verifier, state };
}

export interface OidcProfile {
	sub: string;
	name: string;
	email: string | null;
	picture: string | null;
	groups: string[];
}

export async function handleCallback(currentUrl: URL, verifier: string, state: string): Promise<OidcProfile> {
	const cfg = await oidcConfig();
	// behind a reverse proxy the request URL may be http://… – use the public URL instead
	const callbackUrl = new URL(redirectUri());
	callbackUrl.search = currentUrl.search;
	const tokens = await client.authorizationCodeGrant(cfg, callbackUrl, {
		pkceCodeVerifier: verifier,
		expectedState: state
	});
	const claims = tokens.claims();
	if (!claims) throw new Error('Keine ID-Token-Claims erhalten.');
	let info: Record<string, unknown> = { ...claims };
	try {
		info = { ...info, ...(await client.fetchUserInfo(cfg, tokens.access_token, claims.sub)) };
	} catch {
		// userinfo is optional
	}
	const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
	const groups = Array.isArray(info.groups) ? info.groups.filter((g): g is string => typeof g === 'string') : [];
	return {
		sub: claims.sub,
		name: str(info.name) ?? str(info.preferred_username) ?? str(info.email) ?? 'Unbekannt',
		email: str(info.email),
		picture: str(info.picture),
		groups
	};
}

/** Finds or creates the person for an OIDC identity and refreshes name/avatar. */
export async function upsertOidcPerson(profile: OidcProfile, linkToPersonId?: string | null) {
	const isAdmin = Boolean(config.oidc.adminGroup && profile.groups.includes(config.oidc.adminGroup));
	const [cred] = await db
		.select()
		.from(schema.credentials)
		.where(and(eq(schema.credentials.type, 'oidc'), eq(schema.credentials.subject, profile.sub)))
		.limit(1);
	let personId = cred?.personId;
	if (!personId) {
		// a logged-in guest upgrades to OIDC, or a new person is created
		personId = linkToPersonId ?? (await createPerson(db, { name: profile.name, email: profile.email }));
		await db.insert(schema.credentials).values({
			id: crypto.randomUUID(),
			personId,
			type: 'oidc',
			subject: profile.sub
		});
	}
	await db
		.update(schema.persons)
		// the login provider vouches for its address; without one, an address entered in Split stays
		.set({
			name: profile.name,
			...(profile.email ? { email: profile.email, emailVerified: true, emailFromOidc: true } : {}),
			isAdmin
		})
		.where(eq(schema.persons.id, personId));
	// the provider's picture, unless the person uploaded an own one in Split
	await db
		.update(schema.persons)
		.set({ avatarUrl: profile.picture })
		.where(and(eq(schema.persons.id, personId), or(isNull(schema.persons.avatarUrl), not(like(schema.persons.avatarUrl, '/avatare/%')))));
	await refreshDisplayNames();
	await db
		.update(schema.credentials)
		.set({ lastUsedAt: new Date() })
		.where(and(eq(schema.credentials.type, 'oidc'), eq(schema.credentials.subject, profile.sub)));
	return personId;
}
