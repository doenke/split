import { N as redirect, O as fail, C as error } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { and, eq } from 'drizzle-orm';
import { d as db, m as memberships } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { f as findGroupInvite } from '../../../../chunks/invites.js-DxO04p_p.js';
import { c as createSession } from '../../../../chunks/session.js-BTkwumJz.js';
import { l as loadMembers } from '../../../../chunks/groups.js-By2r4Rg8.js';
import { n as nameFromForm, s as sameName, a as createPerson, m as mergePersons, p as personalKasseId, c as claimedPersonIds } from '../../../../chunks/persons.js-DwTcpoqM.js';
import { p as pickKasseForGroup } from '../../../../chunks/kassen.js-CLUnyc1X.js';
import { a as audit } from '../../../../chunks/audit.js-DeGbxmfN.js';

async function loadInvite(token) {
  const row = await findGroupInvite(token);
  if (!row) error(404, "Dieser Einladungslink ist ungültig oder abgelaufen. Bitte frag nach einem neuen.");
  return row;
}
async function unclaimed(groupId) {
  const members = await loadMembers(groupId);
  const claimed = await claimedPersonIds(members.map((m) => m.personId));
  return members.filter((m) => !claimed.has(m.personId));
}
const load = async ({ params, locals }) => {
  const { group } = await loadInvite(params.token);
  if (locals.user) {
    const [member] = await db.select().from(memberships).where(and(eq(memberships.groupId, group.id), eq(memberships.personId, locals.user.id)));
    if (member) redirect(303, `/gruppen/${group.id}`);
  }
  const open = await unclaimed(group.id);
  return {
    group: { id: group.id, name: group.name, emoji: group.emoji },
    people: open.map((m) => ({ personId: m.personId, name: m.name, color: m.color, avatarUrl: m.avatarUrl })),
    memberCount: (await loadMembers(group.id)).length
  };
};
async function joinAs(groupId, personId, actorId) {
  const kasseId = await pickKasseForGroup(personId, groupId, await personalKasseId(db, personId));
  await db.insert(memberships).values({ groupId, personId, kasseId }).onConflictDoNothing();
  await audit(db, { groupId, personId: actorId, action: "member.add", entityId: personId, data: { via: "group-link" } });
}
const actions = {
  /** Not logged in: "I am X" (a placeholder of the group). */
  claim: async ({ params, cookies, request, locals }) => {
    const { group } = await loadInvite(params.token);
    const personId = String((await request.formData()).get("personId"));
    const open = await unclaimed(group.id);
    if (!open.some((m) => m.personId === personId)) return fail(400, { message: "Diese Person ist schon vergeben." });
    if (locals.user) {
      try {
        await mergePersons(personId, locals.user.id);
      } catch (e) {
        return fail(400, { message: e.message });
      }
      redirect(303, `/gruppen/${group.id}`);
    }
    await createSession(cookies, personId, false);
    redirect(303, `/willkommen?next=${encodeURIComponent(`/gruppen/${group.id}`)}`);
  },
  /** "I'm new here": creates a person (or adds the logged-in user) and joins. */
  join: async ({ params, cookies, request, locals }) => {
    const { group } = await loadInvite(params.token);
    if (locals.user) {
      await joinAs(group.id, locals.user.id, locals.user.id);
      redirect(303, `/gruppen/${group.id}`);
    }
    const name = nameFromForm(await request.formData());
    if (!name) return fail(400, { message: "Bitte gib deinen Vornamen an." });
    const twin = sameName(name, await loadMembers(group.id));
    if (twin) {
      return fail(400, { message: `„${twin.name}“ ist schon in der Gruppe. Bist du das? Dann wähle dich in der Liste – sonst ergänze deinen Nachnamen.` });
    }
    const personId = await createPerson(db, { name });
    await joinAs(group.id, personId, personId);
    await createSession(cookies, personId, false);
    redirect(303, `/willkommen?next=${encodeURIComponent(`/gruppen/${group.id}`)}`);
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-DHJA_PHm.js.map
