import { a as computeShares } from '../../../../../chunks/split.js-Diu3SqNm.js';
import { g as groupCosts } from '../../../../../chunks/costs.js-Dz_Hp_RZ.js';
import { r as requireGroup, d as loadGroupState } from '../../../../../chunks/groups.js-By2r4Rg8.js';

const load = async ({ params, locals }) => {
  await requireGroup(params.id, locals.user);
  const state = await loadGroupState(params.id);
  const costs = await groupCosts(params.id, state);
  const shares = {};
  state.expenses.forEach((e, i) => {
    try {
      shares[e.id] = Object.fromEntries(computeShares(state.coreExpenses[i], state.coreMembers));
    } catch {
      shares[e.id] = {};
    }
  });
  return { costs: { kassen: costs.kassen }, shares, generatedAt: (/* @__PURE__ */ new Date()).toISOString() };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-DuUr5faQ.js.map
