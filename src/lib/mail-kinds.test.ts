import { describe, expect, it } from 'vitest';
import { effectivePrefs, mailKinds } from './mail-kinds';

describe('effectivePrefs', () => {
	it('sends only payment requests and reminders by default', () => {
		const on = Object.entries(effectivePrefs({})).filter(([, v]) => v).map(([k]) => k);
		expect(on.sort()).toEqual(['payment_reminder', 'payment_request']);
	});
	it('stored choices win over the defaults', () => {
		const p = effectivePrefs({ new_expense: true, payment_request: false });
		expect(p.new_expense).toBe(true);
		expect(p.payment_request).toBe(false);
		expect(p.payment_reminder).toBe(true);
	});
	it('"all: false" switches everything off', () => {
		expect(Object.values(effectivePrefs({ all: false, new_expense: true })).some(Boolean)).toBe(false);
	});
	it('knows every kind', () => {
		expect(Object.keys(effectivePrefs({}))).toHaveLength(mailKinds.length);
	});
});
