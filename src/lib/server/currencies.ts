import type { GroupSettings } from './db/schema';
import { caribbeanCurrencies, commonCurrencies, knownCurrencies } from './rates';

/**
 * Currencies offered in the expense form: the group currency plus the group's alternative currencies.
 * Groups that never chose them get the foreign currencies they already used. `extra` keeps the currency of
 * an expense being edited.
 */
export function currencyOptions(group: { baseCurrency: string; settings: GroupSettings }, used: string[], extra: string[] = []) {
	const alternatives = group.settings.currencies ?? used.filter((c) => c !== group.baseCurrency);
	return [...new Set([group.baseCurrency, ...alternatives, ...extra])];
}

/** Currencies listed for choosing alternatives: common ones first, those with ECB rates, Caribbean dollars, and `own` ones. */
export async function selectableCurrencies(own: string[] = []) {
	return [...new Set([...commonCurrencies, ...(await knownCurrencies()), ...caribbeanCurrencies, ...own])];
}

/** Any ISO 4217 currency is allowed (rates for ones the ECB doesn't publish are entered by hand). */
export function isCurrency(code: string) {
	try {
		return /^[A-Z]{3}$/.test(code) && (Intl.supportedValuesOf?.('currency') ?? [code]).includes(code);
	} catch {
		return false;
	}
}
