import type { GroupSettings } from './db/schema';
import { commonCurrencies, knownCurrencies } from './rates';

/**
 * Currencies offered in the expense form: the group currency plus the group's alternative currencies.
 * Groups that never chose them get the foreign currencies they already used. `extra` keeps the currency of
 * an expense being edited.
 */
export function currencyOptions(group: { baseCurrency: string; settings: GroupSettings }, used: string[], extra: string[] = []) {
	const alternatives = group.settings.currencies ?? used.filter((c) => c !== group.baseCurrency);
	return [...new Set([group.baseCurrency, ...alternatives, ...extra])];
}

/** All currencies that can be chosen as alternatives (common ones first). */
export async function selectableCurrencies() {
	return [...new Set([...commonCurrencies, ...(await knownCurrencies())])];
}
