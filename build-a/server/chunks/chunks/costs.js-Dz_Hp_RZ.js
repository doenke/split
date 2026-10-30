import { d as loadGroupState, g as consumptionByCategory } from './groups.js-By2r4Rg8.js';

async function groupCosts(groupId, state) {
  const s = state ?? await loadGroupState(groupId);
  const byPerson = consumptionByCategory(
    s.coreMembers,
    s.expenses.map((e, i) => ({ expense: s.coreExpenses[i], categoryId: e.categoryId }))
  );
  const kasseOf = new Map(s.members.map((m) => [m.personId, m.kasseId]));
  const persons = {};
  const kassen = {};
  for (const [personId, cats] of byPerson) {
    const kasseId = kasseOf.get(personId) ?? personId;
    persons[personId] = Object.fromEntries(cats);
    kassen[kasseId] ??= {};
    for (const [c, v] of cats) kassen[kasseId][c] = (kassen[kasseId][c] ?? 0) + v;
  }
  return { persons, kassen, group: s.group };
}

export { groupCosts as g };
//# sourceMappingURL=costs.js-Dz_Hp_RZ.js.map
