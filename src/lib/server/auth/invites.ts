import { and, eq, gt, isNull } from 'drizzle-orm';
import { config } from '../config';
import { db, schema } from '../db';
import { hashToken, newToken } from '../ids';

const PERSONAL_DAYS = 14;

/** Creates a personal login link for a person. Older unused links of that person stay valid. */
export async function createPersonalInvite(
	personId: string,
	groupId: string | null,
	createdBy: string,
	validMinutes = PERSONAL_DAYS * 24 * 60
) {
	const token = newToken();
	const expiresAt = new Date(Date.now() + validMinutes * 60_000);
	await db.insert(schema.inviteTokens).values({
		id: hashToken(token),
		type: 'personal',
		personId,
		groupId,
		createdBy,
		expiresAt
	});
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
				eq(schema.inviteTokens.type, 'personal'),
				gt(schema.inviteTokens.expiresAt, new Date()),
				isNull(schema.inviteTokens.usedAt)
			)
		)
		.limit(1);
	return row ?? null;
}

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
