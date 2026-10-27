import { commonCurrencies, knownCurrencies } from './rates';

/** Currencies offered in the expense form: base first, then recently used, then common/known ones. */
export async function currencyOptions(base: string, used: string[]) {
	const known = await knownCurrencies();
	return [...new Set([base, ...used, ...commonCurrencies, ...known])];
}
