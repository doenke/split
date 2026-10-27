import { json } from '@sveltejs/kit';
import { requireGroup } from '$lib/server/groups';
import { lookupRate } from '$lib/server/rates';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const { group } = await requireGroup(params.id, locals.user);
	const currency = url.searchParams.get('currency') ?? '';
	const date = url.searchParams.get('date') ?? '';
	if (!/^[A-Z]{3}$/.test(currency) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return json({ message: 'Ungültige Anfrage' }, { status: 400 });
	}
	const rate = await lookupRate(currency, group.baseCurrency, date);
	if (!rate) return json({ message: `Kein Kurs für ${currency} bekannt – bitte manuell angeben.` }, { status: 404 });
	return json(rate);
};
