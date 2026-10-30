import { r as requireGroup, d as loadGroupState, e as loadCategories, a as loadExpenses } from '../../../../chunks/groups.js-By2r4Rg8.js';
import { c as completionState } from '../../../../chunks/completion.js-DPOSbHRR.js';
import { r as receiptRecognitionEnabled } from '../../../../chunks/receipts.js-DUrhzTGM.js';

const load = async ({ params, locals, depends }) => {
  depends("app:group");
  const g = await requireGroup(params.id, locals.user);
  const [state, categories, drafts] = await Promise.all([
    loadGroupState(params.id),
    loadCategories(params.id),
    loadExpenses(params.id, "draft")
  ]);
  const kassen = Object.fromEntries(state.kassen.map((k) => [k.id, { id: k.id, name: k.name, personalOf: k.personalOf }]));
  const balances = {
    persons: Object.fromEntries(state.balances.persons),
    kassen: Object.fromEntries(state.balances.kassen),
    errors: state.balances.errors
  };
  return {
    group: state.group,
    isAdmin: g.isAdmin,
    myKasseId: g.membership.kasseId,
    members: state.members,
    expenses: state.expenses,
    drafts,
    settlements: state.settlements,
    profiles: state.profiles,
    categories,
    kassen,
    balances,
    transfers: state.transfers,
    completion: await completionState(state.members, state.group),
    receiptRecognition: receiptRecognitionEnabled()
  };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

export { _layout_server_ts as _ };
//# sourceMappingURL=_layout.server.ts.js-B1klQIjF.js.map
