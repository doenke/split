import { consumptionByCategory } from '$lib/core/balance';
import { loadGroupState } from './groups';

export type CategoryTotals = Record<string, number>;

/** Consumption per person and per Kasse, split by category, for one group. */
export async function groupCosts(groupId: string, state?: Awaited<ReturnType<typeof loadGroupState>>) {
	const s = state ?? (await loadGroupState(groupId));
	const byPerson = consumptionByCategory(
		s.coreMembers,
		s.expenses.map((e, i) => ({ expense: s.coreExpenses[i], categoryId: e.categoryId }))
	);
	const kasseOf = new Map(s.members.map((m) => [m.personId, m.kasseId]));
	const persons: Record<string, CategoryTotals> = {};
	const kassen: Record<string, CategoryTotals> = {};
	for (const [personId, cats] of byPerson) {
		const kasseId = kasseOf.get(personId) ?? personId;
		persons[personId] = Object.fromEntries(cats);
		kassen[kasseId] ??= {};
		for (const [c, v] of cats) kassen[kasseId][c] = (kassen[kasseId][c] ?? 0) + v;
	}
	return { persons, kassen, group: s.group };
}
