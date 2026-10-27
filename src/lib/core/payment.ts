import { currencyDigits } from './currency';
import type { Minor } from './types';

export function normalizeIban(iban: string): string {
	return iban.replace(/\s+/g, '').toUpperCase();
}

/** Checks country format and the mod-97 checksum of an IBAN. */
export function isValidIban(input: string): boolean {
	const iban = normalizeIban(input);
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
	const rearranged = iban.slice(4) + iban.slice(0, 4);
	const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
	let rest = 0;
	for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
	return rest === 1;
}

export function formatIban(iban: string): string {
	return normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();
}

/** Extracts the PayPal.me name from a name or a pasted link. */
export function normalizePaypalMe(input: string): string | null {
	const s = input.trim().replace(/^https?:\/\//, '').replace(/^(www\.)?paypal\.me\//i, '').split(/[/?#]/)[0];
	return /^[A-Za-z0-9]{1,30}$/.test(s) ? s : null;
}

function major(amount: Minor, currency: string): string {
	const d = currencyDigits(currency);
	return (amount / 10 ** d).toFixed(d);
}

export function paypalLink(name: string, amount: Minor, currency: string): string {
	return `https://paypal.me/${encodeURIComponent(name)}/${major(amount, currency)}${currency}`;
}

/**
 * Payload of an EPC QR code ("GiroCode", EPC069-12, version 002) for a SEPA credit transfer.
 * Only valid for EUR.
 */
export function epcPayload(data: { name: string; iban: string; amount: Minor; text: string }): string {
	const clean = (s: string, max: number) => s.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
	return [
		'BCD',
		'002',
		'1',
		'SCT',
		'', // BIC is optional within the EEA
		clean(data.name, 70),
		normalizeIban(data.iban),
		'EUR' + major(data.amount, 'EUR'),
		'', // purpose
		'', // structured reference
		clean(data.text, 140)
	].join('\n');
}
