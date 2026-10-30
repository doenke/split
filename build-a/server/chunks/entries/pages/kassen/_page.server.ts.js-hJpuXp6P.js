import { N as redirect, O as fail } from '../../../chunks/utils.js-BjQHIhHk.js';
import { d as db, k as kassen, n as kasseMembers } from '../../../chunks/index3.js-LeA4cvVT.js';
import { n as newId } from '../../../chunks/ids.js-2U6-pnrm.js';
import { a as accessibleKassenOf, d as kasseOverview, k as kasseMembersOf } from '../../../chunks/kassen.js-CLUnyc1X.js';

const load = async ({ locals }) => {
  if (!locals.user) redirect(303, "/login");
  const kassen2 = await accessibleKassenOf(locals.user.id);
  return {
    kassen: await Promise.all(
      kassen2.map(async (k) => ({
        ...k,
        members: await kasseMembersOf(k.id),
        totals: (await kasseOverview(k.id)).totals
      }))
    )
  };
};
const actions = {
  create: async ({ locals, request }) => {
    if (!locals.user) redirect(303, "/login");
    const f = await request.formData();
    const name = String(f.get("name") ?? "").trim();
    if (!name) return fail(400, { message: "Bitte einen Namen angeben." });
    const includeMe = f.get("includeMe") === "on";
    const id = newId();
    const userId = locals.user.id;
    await db.transaction(async (tx) => {
      await tx.insert(kassen).values({ id, name, receiverPersonId: includeMe ? userId : null, createdBy: userId });
      if (includeMe) await tx.insert(kasseMembers).values({ kasseId: id, personId: userId, isManager: true });
    });
    redirect(303, `/kassen/${id}`);
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-hJpuXp6P.js.map
