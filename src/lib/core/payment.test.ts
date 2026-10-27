import { describe, expect, it } from 'vitest';
import { epcPayload, formatIban, isValidIban, normalizePaypalMe, paypalLink } from './payment';

describe('payment helpers', () => {
	it('validates IBANs', () => {
		expect(isValidIban('DE89 3704 0044 0532 0130 00')).toBe(true);
		expect(isValidIban('DE89 3704 0044 0532 0130 01')).toBe(false);
		expect(isValidIban('kaputt')).toBe(false);
		expect(formatIban('de89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
	});

	it('extracts PayPal.me names', () => {
		expect(normalizePaypalMe('https://www.paypal.me/AnnaM/12')).toBe('AnnaM');
		expect(normalizePaypalMe('AnnaM')).toBe('AnnaM');
		expect(normalizePaypalMe('nicht gültig!')).toBeNull();
		expect(paypalLink('AnnaM', 4730, 'EUR')).toBe('https://paypal.me/AnnaM/47.30EUR');
	});

	it('builds an EPC QR payload', () => {
		expect(
			epcPayload({ name: 'Anna Muster', iban: 'DE89 3704 0044 0532 0130 00', amount: 4730, text: 'Split: Toskana' })
		).toBe('BCD\n002\n1\nSCT\n\nAnna Muster\nDE89370400440532013000\nEUR47.30\n\n\nSplit: Toskana');
	});
});
