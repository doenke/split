import { and, eq, gt, isNull } from 'drizzle-orm';
import { config } from '../config';
import { db, schema } from '../db';
import { hashToken, newToken } from '../ids';

const PERSONAL_DAYS = 14;

/** Creates a personal login link for a person. Older unused links of that person stay valid. */
export async function createPersonalInvite(personId: string, groupId: string | null, createdBy: string) {
	const token = newToken();
	const expiresAt = new Date(Date.now() + PERSONAL_DAYS * 86_400_000);
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
