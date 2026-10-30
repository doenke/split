import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { hashToken, newToken } from '../ids';
import { toSessionUser } from './session';

const PREFIX = 'split_';

/** Creates a key for an AI assistant. The key itself is only shown once. */
export async function createApiToken(personId: string, label: string) {
	const token = PREFIX + newToken();
	await db.insert(schema.apiTokens).values({ id: hashToken(token), personId, label: label.slice(0, 60) || 'KI-Assistent' });
	return token;
}

export async function listApiTokens(personId: string) {
	return db
		.select({ id: schema.apiTokens.id, label: schema.apiTokens.label, createdAt: schema.apiTokens.createdAt, lastUsedAt: schema.apiTokens.lastUsedAt })
		.from(schema.apiTokens)
		.where(eq(schema.apiTokens.personId, personId))
		.orderBy(desc(schema.apiTokens.createdAt));
}

export async function revokeApiToken(personId: string, id: string) {
	await db.delete(schema.apiTokens).where(and(eq(schema.apiTokens.id, id), eq(schema.apiTokens.personId, personId)));
}

/** The user a key belongs to, or null. */
export async function userForApiToken(token: string) {
	if (!token.startsWith(PREFIX)) return null;
	const id = hashToken(token);
	const [row] = await db
		.select({ person: schema.persons })
		.from(schema.apiTokens)
		.innerJoin(schema.persons, eq(schema.persons.id, schema.apiTokens.personId))
		.where(eq(schema.apiTokens.id, id));
	if (!row) return null;
	const person = row.person;
	// merged into another person: the key now acts for that one
	if (person.mergedInto) {
		await db.update(schema.apiTokens).set({ personId: person.mergedInto }).where(eq(schema.apiTokens.id, id));
		return userForApiToken(token);
	}
	void db.update(schema.apiTokens).set({ lastUsedAt: new Date() }).where(eq(schema.apiTokens.id, id)).catch(() => {});
	return toSessionUser(person);
}
