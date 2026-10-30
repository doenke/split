import { g as groupCosts } from '../../../../../chunks/costs.js-Dz_Hp_RZ.js';
import { r as requireGroup } from '../../../../../chunks/groups.js-By2r4Rg8.js';

const load = async ({ params, locals }) => {
  await requireGroup(params.id, locals.user);
  const { persons, kassen } = await groupCosts(params.id);
  return { costs: { persons, kassen } };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-XORXn4XL.js.map
