import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db, schema, type Tx } from './db';
import { newId } from './ids';

const colors = ['#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#8e7dbe', '#5b8e7d', '#d1495b', '#00798c', '#edae49'];

export function randomColor() {
	return colors[Math.floor(Math.random() * colors.length)];
}

/** Creates a person together with their personal Kasse. */
export async function createPerson(
	tx: Tx | typeof db,
	data: { name: string; email?: string | null; avatarUrl?: string | null; createdBy?: string | null }
) {
	const id = newId();
	await tx.insert(schema.persons).values({
		id,
		name: data.name,
		email: data.email ?? null,
		avatarUrl: data.avatarUrl ?? null,
		color: randomColor(),
		createdBy: data.createdBy ?? null
	});
	await tx.insert(schema.kassen).values({
		id: newId(),
		name: data.name,
		personalOf: id,
		receiverPersonId: id,
		createdBy: data.createdBy ?? id
	});
	return id;
}

export async function personalKasseId(tx: Tx | typeof db, personId: string): Promise<string> {
	const [k] = await tx
		.select({ id: schema.kassen.id })
		.from(schema.kassen)
		.where(eq(schema.kassen.personalOf, personId))
		.limit(1);
	if (k) return k.id;
	const [p] = await tx.select({ name: schema.persons.name }).from(schema.persons).where(eq(schema.persons.id, personId));
	const id = newId();
	await tx.insert(schema.kassen).values({ id, name: p?.name ?? '?', personalOf: personId, receiverPersonId: personId });
	return id;
}

/** Whether a person can log in (has a credential or an active session). */
export async function claimedPersonIds(personIds: string[]): Promise<Set<string>> {
	if (!personIds.length) return new Set();
	const creds = await db
		.selectDistinct({ id: schema.credentials.personId })
		.from(schema.credentials)
		.where(inArray(schema.credentials.personId, personIds));
	const sessions = await db
		.selectDistinct({ id: schema.sessions.personId })
		.from(schema.sessions)
		.where(and(inArray(schema.sessions.personId, personIds), sql`${schema.sessions.expiresAt} > now()`));
	return new Set([...creds, ...sessions].map((r) => r.id));
}

/** People the user knows from groups and Kassen (to add them without a new invite). */
export async function knownPersons(userId: string) {
	const cols = { id: schema.persons.id, name: schema.persons.name, color: schema.persons.color, avatarUrl: schema.persons.avatarUrl };
	const myGroups = db
		.select({ id: schema.memberships.groupId })
		.from(schema.memberships)
		.where(eq(schema.memberships.personId, userId));
	const myKassen = db
		.select({ id: schema.kasseMembers.kasseId })
		.from(schema.kasseMembers)
		.where(eq(schema.kasseMembers.personId, userId));
	const [fromGroups, fromKassen] = await Promise.all([
		db
			.selectDistinct(cols)
			.from(schema.memberships)
			.innerJoin(schema.persons, eq(schema.persons.id, schema.memberships.personId))
			.where(and(inArray(schema.memberships.groupId, myGroups), isNull(schema.persons.mergedInto))),
		db
			.selectDistinct(cols)
			.from(schema.kasseMembers)
			.innerJoin(schema.persons, eq(schema.persons.id, schema.kasseMembers.personId))
			.where(and(inArray(schema.kasseMembers.kasseId, myKassen), isNull(schema.persons.mergedInto)))
	]);
	const all = new Map([...fromGroups, ...fromKassen].map((p) => [p.id, p]));
	all.delete(userId);
	return [...all.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/**
 * Merges `fromId` (usually a placeholder) into `intoId`: all memberships, payments and
 * Kassen move over. Fails if both are members of the same group.
 */
export async function mergePersons(fromId: string, intoId: string) {
	await db.transaction(async (tx) => {
		const fromGroups = await tx
			.select({ groupId: schema.memberships.groupId, kasseId: schema.memberships.kasseId })
			.from(schema.memberships)
			.where(eq(schema.memberships.personId, fromId));
		const intoGroups = new Set(
			(
				await tx
					.select({ groupId: schema.memberships.groupId })
					.from(schema.memberships)
					.where(eq(schema.memberships.personId, intoId))
			).map((r) => r.groupId)
		);
		const conflict = fromGroups.find((g) => intoGroups.has(g.groupId));
		if (conflict) throw new Error('Beide Personen sind bereits Mitglied derselben Gruppe.');

		const fromKasse = await personalKasseId(tx, fromId);
		const intoKasse = await personalKasseId(tx, intoId);
		await tx.update(schema.memberships).set({ personId: intoId }).where(eq(schema.memberships.personId, fromId));
		await tx
			.update(schema.memberships)
			.set({ kasseId: intoKasse })
			.where(and(eq(schema.memberships.personId, intoId), eq(schema.memberships.kasseId, fromKasse)));
		await tx.update(schema.expensePayers).set({ personId: intoId }).where(eq(schema.expensePayers.personId, fromId));
		await tx.update(schema.settlements).set({ fromKasseId: intoKasse }).where(eq(schema.settlements.fromKasseId, fromKasse));
		await tx.update(schema.settlements).set({ toKasseId: intoKasse }).where(eq(schema.settlements.toKasseId, fromKasse));
		// shared Kassen: keep membership, drop duplicates
		const intoKassen = new Set(
			(await tx.select({ id: schema.kasseMembers.kasseId }).from(schema.kasseMembers).where(eq(schema.kasseMembers.personId, intoId))).map((r) => r.id)
		);
		const fromKassen = await tx.select().from(schema.kasseMembers).where(eq(schema.kasseMembers.personId, fromId));
		for (const km of fromKassen) {
			if (intoKassen.has(km.kasseId)) continue;
			await tx.insert(schema.kasseMembers).values({ ...km, personId: intoId });
		}
		await tx.delete(schema.kasseMembers).where(eq(schema.kasseMembers.personId, fromId));
		await tx.update(schema.persons).set({ mergedInto: intoId }).where(eq(schema.persons.id, fromId));
		await tx.delete(schema.kassen).where(eq(schema.kassen.id, fromKasse));
		// rules referencing the old id are rewritten in place
		await tx.execute(sql`update expenses set rule = replace(rule::text, ${'"' + fromId + '"'}, ${'"' + intoId + '"'})::jsonb where rule::text like ${'%' + fromId + '%'}`);
		await tx.execute(sql`update profiles set rule = replace(rule::text, ${'"' + fromId + '"'}, ${'"' + intoId + '"'})::jsonb where rule::text like ${'%' + fromId + '%'}`);
	});
}
