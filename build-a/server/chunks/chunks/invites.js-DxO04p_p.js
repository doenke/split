import { and, eq, isNull, gt, inArray } from 'drizzle-orm';
import { c as config } from './config.js-oO6Fsv50.js';
import { d as db, t as inviteTokens, p as persons, g as groups } from './index3.js-LeA4cvVT.js';
import { a as newToken, h as hashToken } from './ids.js-2U6-pnrm.js';

const PERSONAL_DAYS = 90;
const PAIRING_MINUTES = 10;
const personalExpiry = () => new Date(Date.now() + PERSONAL_DAYS * 864e5);
async function createPersonalInvite(personId, groupId, createdBy) {
  const token = newToken();
  const expiresAt = personalExpiry();
  await db.update(inviteTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(and(eq(inviteTokens.personId, personId), eq(inviteTokens.type, "personal"), isNull(inviteTokens.usedAt)));
  await db.insert(inviteTokens).values({ id: hashToken(token), type: "personal", personId, groupId, createdBy, expiresAt });
  return { url: `${config.publicUrl}/j/${token}`, expiresAt };
}
async function createPairingInvite(personId) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + PAIRING_MINUTES * 6e4);
  await db.insert(inviteTokens).values({ id: hashToken(token), type: "pairing", personId, createdBy: personId, expiresAt });
  return { url: `${config.publicUrl}/j/${token}`, expiresAt };
}
async function findInvite(token) {
  const [row] = await db.select({ invite: inviteTokens, person: persons }).from(inviteTokens).leftJoin(persons, eq(persons.id, inviteTokens.personId)).where(
    and(
      eq(inviteTokens.id, hashToken(token)),
      inArray(inviteTokens.type, ["personal", "pairing"]),
      gt(inviteTokens.expiresAt, /* @__PURE__ */ new Date()),
      isNull(inviteTokens.usedAt)
    )
  ).limit(1);
  return row ?? null;
}
async function inviteUsed(token, type) {
  await db.update(inviteTokens).set(type === "personal" ? { expiresAt: personalExpiry() } : { usedAt: /* @__PURE__ */ new Date() }).where(eq(inviteTokens.id, hashToken(token)));
}
async function markInviteUsed(token) {
  await db.update(inviteTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq(inviteTokens.id, hashToken(token)));
}
const GROUP_DAYS = 60;
async function activeGroupInvite(groupId) {
  const [row] = await db.select().from(inviteTokens).where(
    and(
      eq(inviteTokens.groupId, groupId),
      eq(inviteTokens.type, "group"),
      gt(inviteTokens.expiresAt, /* @__PURE__ */ new Date()),
      isNull(inviteTokens.usedAt)
    )
  ).limit(1);
  return row?.token ? { url: `${config.publicUrl}/g/${row.token}`, expiresAt: row.expiresAt } : null;
}
async function createGroupInvite(groupId, createdBy) {
  await revokeGroupInvite(groupId);
  const token = newToken().slice(0, 22);
  const expiresAt = new Date(Date.now() + GROUP_DAYS * 864e5);
  await db.insert(inviteTokens).values({ id: hashToken(token), type: "group", token, groupId, createdBy, expiresAt });
  return { url: `${config.publicUrl}/g/${token}`, expiresAt };
}
async function revokeGroupInvite(groupId) {
  await db.update(inviteTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(and(eq(inviteTokens.groupId, groupId), eq(inviteTokens.type, "group"), isNull(inviteTokens.usedAt)));
}
async function findGroupInvite(token) {
  const [row] = await db.select({ invite: inviteTokens, group: groups }).from(inviteTokens).innerJoin(groups, eq(groups.id, inviteTokens.groupId)).where(
    and(
      eq(inviteTokens.id, hashToken(token)),
      eq(inviteTokens.type, "group"),
      gt(inviteTokens.expiresAt, /* @__PURE__ */ new Date()),
      isNull(inviteTokens.usedAt),
      isNull(groups.deletedAt)
    )
  ).limit(1);
  return row ?? null;
}

export { createGroupInvite as a, activeGroupInvite as b, createPersonalInvite as c, findInvite as d, createPairingInvite as e, findGroupInvite as f, inviteUsed as i, markInviteUsed as m, revokeGroupInvite as r };
//# sourceMappingURL=invites.js-DxO04p_p.js.map
