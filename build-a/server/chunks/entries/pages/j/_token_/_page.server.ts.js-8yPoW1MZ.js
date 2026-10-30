import { N as redirect, O as fail, C as error } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { eq } from 'drizzle-orm';
import { m as markInviteUsed, i as inviteUsed, d as findInvite } from '../../../../chunks/invites.js-DxO04p_p.js';
import { d as destroySession, c as createSession } from '../../../../chunks/session.js-BTkwumJz.js';
import { d as db, g as groups } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { m as mergePersons } from '../../../../chunks/persons.js-DwTcpoqM.js';

async function loadInvite(token) {
  const invite = await findInvite(token);
  if (!invite || !invite.person || invite.person.mergedInto) {
    error(404, "Dieser Link ist ungültig oder abgelaufen. Bitte lass dir einen neuen Link schicken.");
  }
  let group = null;
  if (invite.invite.groupId) {
    [group] = await db.select({ id: groups.id, name: groups.name, emoji: groups.emoji }).from(groups).where(eq(groups.id, invite.invite.groupId));
  }
  return { ...invite, person: invite.person, group: group ?? null };
}
const load = async ({ params, locals }) => {
  const { person, group } = await loadInvite(params.token);
  return {
    person: { id: person.id, name: person.name, color: person.color, avatarUrl: person.avatarUrl },
    group,
    sameUser: locals.user?.id === person.id
  };
};
const actions = {
  /** "Yes, that's me": log in as the invited person. */
  claim: async ({ params, cookies, locals }) => {
    const { person, group, invite } = await loadInvite(params.token);
    if (locals.user && locals.user.id !== person.id) await destroySession(cookies, locals.sessionId);
    await createSession(cookies, person.id, false);
    await inviteUsed(params.token, invite.type);
    const next = encodeURIComponent(group ? `/gruppen/${group.id}` : "/");
    redirect(303, `/willkommen?next=${next}${invite.type === "personal" ? `&link=${encodeURIComponent(params.token)}` : ""}`);
  },
  /** Already logged in as someone else: the invited placeholder is me – merge it into my person. */
  merge: async ({ params, locals }) => {
    if (!locals.user) redirect(303, "/login");
    const { person, group } = await loadInvite(params.token);
    try {
      await mergePersons(person.id, locals.user.id);
    } catch (e) {
      return fail(400, { message: e.message });
    }
    await markInviteUsed(params.token);
    redirect(303, group ? `/gruppen/${group.id}` : "/");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-8yPoW1MZ.js.map
