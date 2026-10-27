import { computePaid, computeShares } from '$lib/core/split';
import { amountToInput } from '$lib/core/currency';
import { loadCategories, loadGroupState, requireGroup } from '$lib/server/groups';
import type { RequestHandler } from './$types';

const cell = (v: string | number | null | undefined) => {
	const s = v === null || v === undefined ? '' : String(v);
	return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** All expenses as CSV (semicolon separated, for Excel/LibreOffice with German settings). */
export const GET: RequestHandler = async ({ params, locals }) => {
	await requireGroup(params.id, locals.user);
	const [state, categories] = await Promise.all([loadGroupState(params.id), loadCategories(params.id)]);
	const base = state.group.baseCurrency;
	const cats = new Map(categories.map((c) => [c.id, c.name]));
	const people = state.members;
	const name = new Map(people.map((p) => [p.personId, p.name]));
	const header = [
		'Datum', 'Titel', 'Typ', 'Kategorie', 'Betrag', 'Währung', 'Kurs', `Betrag ${base}`, `Privat ${base}`, 'Bezahlt von',
		...people.flatMap((p) => [`${p.name} bezahlt`, `${p.name} Anteil`]),
		'Notiz'
	];
	const rows = [header.map(cell).join(';')];
	state.expenses
		.slice()
		.reverse()
		.forEach((e, i) => {
			const core = state.coreExpenses[state.expenses.length - 1 - i];
			let shares = new Map<string, number>();
			let paid = new Map<string, number>();
			try {
				shares = computeShares(core, state.coreMembers);
				paid = computePaid(core);
			} catch {
				// unsplittable expenses are exported without shares
			}
			rows.push(
				[
					e.date,
					e.title,
					e.type === 'income' ? 'Einnahme' : 'Ausgabe',
					e.categoryId ? cats.get(e.categoryId) : '',
					amountToInput(e.amount, e.currency),
					e.currency,
					e.currency === base ? '' : String(e.rate).replace('.', ','),
					amountToInput(e.baseAmount, base),
					amountToInput(e.privateAmount, base),
					e.payers.map((p) => name.get(p.personId) ?? '?').join(', '),
					...people.flatMap((p) => [
						amountToInput(paid.get(p.personId) ?? 0, base),
						amountToInput(shares.get(p.personId) ?? 0, base)
					]),
					e.notes ?? ''
				]
					.map(cell)
					.join(';')
			);
		});
	const filename = `${state.group.name.replace(/[^\w\- äöüÄÖÜß]/g, '')}.csv`;
	return new Response('﻿' + rows.join('\r\n') + '\r\n', {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
		}
	});
};
