import type { Minor } from './types';

const digitsCache = new Map<string, number>();

/** Number of minor-unit digits of a currency (EUR: 2, JPY: 0, KWD: 3). */
export function currencyDigits(currency: string): number {
	let d = digitsCache.get(currency);
	if (d === undefined) {
		try {
			d = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
				.maximumFractionDigits ?? 2;
		} catch {
			d = 2;
		}
		digitsCache.set(currency, d);
	}
	return d;
}

/**
 * Converts an amount into the base currency.
 * `rate` = how many units of the base currency one unit of `from` is worth.
 */
export function convert(amount: Minor, from: string, base: string, rate: number): Minor {
	if (from === base) return amount;
	const major = amount / 10 ** currencyDigits(from);
	return Math.round(major * rate * 10 ** currencyDigits(base));
}

/** Rate derived from an amount and what was actually charged in base currency. */
export function rateFromCharged(amount: Minor, from: string, charged: Minor, base: string): number {
	const major = amount / 10 ** currencyDigits(from);
	const chargedMajor = charged / 10 ** currencyDigits(base);
	return chargedMajor / major;
}

/** Parses user input like "12,50", "1.234,56" or "12.5" into minor units. */
export function parseAmount(input: string, currency: string): Minor | null {
	let s = input.trim().replace(/\s|€/g, '');
	if (!s) return null;
	const negative = s.startsWith('-');
	if (negative) s = s.slice(1);
	const lastComma = s.lastIndexOf(',');
	const lastDot = s.lastIndexOf('.');
	const decimalSep = lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : null;
	if (decimalSep) {
		const other = decimalSep === ',' ? '.' : ',';
		const [intPart, frac] = [s.slice(0, s.lastIndexOf(decimalSep)), s.slice(s.lastIndexOf(decimalSep) + 1)];
		// "1.234" with dot and exactly 3 digits and no comma → thousands separator
		if (decimalSep === '.' && !s.includes(',') && frac.length === 3 && intPart.length > 0) {
			s = intPart + frac;
		} else {
			s = intPart.split(other).join('') + '.' + frac;
		}
	}
	if (!/^\d*(\.\d*)?$/.test(s) || s === '.') return null;
	const digits = currencyDigits(currency);
	const value = Math.round(parseFloat(s) * 10 ** digits);
	if (!Number.isFinite(value)) return null;
	return negative ? -value : value;
}

export function formatAmount(amount: Minor, currency: string, locale = 'de-DE'): string {
	const digits = currencyDigits(currency);
	return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / 10 ** digits);
}

/** Amount as plain decimal string for input fields, e.g. "12,50". */
export function amountToInput(amount: Minor, currency: string): string {
	const digits = currencyDigits(currency);
	return (amount / 10 ** digits).toFixed(digits).replace('.', ',');
}
