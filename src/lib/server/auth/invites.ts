import { and, eq, gt, inArray, isNull } from 'drizzle-orm';
import { config } from '../config';
import { db, schema } from '../db';
import { hashToken, newToken } from '../ids';

/** A personal link works again and again; every use extends it by this many days. */
const PERSONAL_DAYS = 90;
const PAIRING_MINUTES = 10;

const personalExpiry = () => new Date(Date.now() + PERSONAL_DAYS * 86_400_000);

/**
 * Creates the personal login link of a person (no account needed: the link is the key).
 * It replaces the person's older links, so a link that got into wrong hands can be renewed.
 */
export async function createPersonalInvite(personId: string, groupId: string | null, createdBy: string) {
	const token = newToken();
	const expiresAt = personalExpiry();
	await db
		.update(schema.inviteTokens)
		.set({ usedAt: new Date() })
		.where(and(eq(schema.inviteTokens.personId, personId), eq(schema.inviteTokens.type, 'personal'), isNull(schema.inviteTokens.usedAt)));
	await db.insert(schema.inviteTokens).values({ id: hashToken(token), type: 'personal', personId, groupId, createdBy, expiresAt });
	return { url: `${config.publicUrl}/j/${token}`, expiresAt };
}

/** Short-lived, single-use link to log in another device of the same person. */
export async function createPairingInvite(personId: string) {
	const token = newToken();
	const expiresAt = new Date(Date.now() + PAIRING_MINUTES * 60_000);
	await db.insert(schema.inviteTokens).values({ id: hashToken(token), type: 'pairing', personId, createdBy: personId, expiresAt });
	return { url: `${config.publicUrl}/j/${token}`, expiresAt };
}

export async function findInvite(token: string) {
	const [row] = await db
		.select({ invite: schema.inviteTokens, person: schema.persons })
		.from(schema.inviteTokens)
		.leftJoin(schema.persons, eq(schema.persons.id, schema.inviteTokens.personId))
		.where(
			and(
				eq(schema.inviteTokens.id, hashToken(token)),
				inArray(schema.inviteTokens.type, ['personal', 'pairing']),
				gt(schema.inviteTokens.expiresAt, new Date()),
				isNull(schema.inviteTokens.usedAt)
			)
		)
		.limit(1);
	return row ?? null;
}

/** After logging in with a link: a pairing link is used up, a personal link stays valid for another 90 days. */
export async function inviteUsed(token: string, type: 'personal' | 'group' | 'pairing') {
	await db
		.update(schema.inviteTokens)
		.set(type === 'personal' ? { expiresAt: personalExpiry() } : { usedAt: new Date() })
		.where(eq(schema.inviteTokens.id, hashToken(token)));
}

/** The link is no longer needed (e.g. the placeholder was merged into an existing account). */
export async function markInviteUsed(token: string) {
	await db.update(schema.inviteTokens).set({ usedAt: new Date() }).where(eq(schema.inviteTokens.id, hashToken(token)));
}

const GROUP_DAYS = 60;

/** The active "Who are you?" link of a group, if any. */
export async function activeGroupInvite(groupId: string) {
	const [row] = await db
		.select()
		.from(schema.inviteTokens)
		.where(
			and(
				eq(schema.inviteTokens.groupId, groupId),
				eq(schema.inviteTokens.type, 'group'),
				gt(schema.inviteTokens.expiresAt, new Date()),
				isNull(schema.inviteTokens.usedAt)
			)
		)
		.limit(1);
	return row?.token ? { url: `${config.publicUrl}/g/${row.token}`, expiresAt: row.expiresAt } : null;
}

/** Replaces the group link (the old one stops working). */
export async function createGroupInvite(groupId: string, createdBy: string) {
	await revokeGroupInvite(groupId);
	const token = newToken().slice(0, 22);
	const expiresAt = new Date(Date.now() + GROUP_DAYS * 86_400_000);
	await db.insert(schema.inviteTokens).values({ id: hashToken(token), type: 'group', token, groupId, createdBy, expiresAt });
	return { url: `${config.publicUrl}/g/${token}`, expiresAt };
}

export async function revokeGroupInvite(groupId: string) {
	await db
		.update(schema.inviteTokens)
		.set({ usedAt: new Date() })
		.where(and(eq(schema.inviteTokens.groupId, groupId), eq(schema.inviteTokens.type, 'group'), isNull(schema.inviteTokens.usedAt)));
}

export async function findGroupInvite(token: string) {
	const [row] = await db
		.select({ invite: schema.inviteTokens, group: schema.groups })
		.from(schema.inviteTokens)
		.innerJoin(schema.groups, eq(schema.groups.id, schema.inviteTokens.groupId))
		.where(
			and(
				eq(schema.inviteTokens.id, hashToken(token)),
				eq(schema.inviteTokens.type, 'group'),
				gt(schema.inviteTokens.expiresAt, new Date()),
				isNull(schema.inviteTokens.usedAt),
				isNull(schema.groups.deletedAt)
			)
		)
		.limit(1);
	return row ?? null;
}
