import { N as redirect } from '../../../chunks/utils.js-BjQHIhHk.js';
import { eq, and, isNull, ne, desc } from 'drizzle-orm';
import { d as db, g as groups, m as memberships } from '../../../chunks/index3.js-LeA4cvVT.js';

const load = async ({ locals, url }) => {
  if (!locals.user) redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  const groups$1 = await db.select({ id: groups.id, name: groups.name, emoji: groups.emoji }).from(memberships).innerJoin(groups, eq(groups.id, memberships.groupId)).where(and(eq(memberships.personId, locals.user.id), isNull(groups.deletedAt), ne(groups.status, "archived"))).orderBy(desc(groups.createdAt));
  return { groups: groups$1 };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-12pg-JLm.js.map
