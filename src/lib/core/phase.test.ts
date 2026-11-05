import { describe, expect, it } from 'vitest';
import { groupPhase } from './phase';

const base = { status: 'active', archivedAt: null, startDate: null, endDate: null, expenseCount: 0, openTransfers: 0 };
const today = '2026-07-10';

describe('groupPhase', () => {
	it('is planned until the start date or the first expense', () => {
		expect(groupPhase(base, today)).toBe('planned');
		expect(groupPhase({ ...base, startDate: '2026-07-20' }, today)).toBe('planned');
		expect(groupPhase({ ...base, startDate: '2026-07-10' }, today)).toBe('active');
		expect(groupPhase({ ...base, expenseCount: 1 }, today)).toBe('active');
	});
	it('starts soon with expenses before the start date', () => {
		expect(groupPhase({ ...base, startDate: '2026-07-20', expenseCount: 1 }, today)).toBe('soon');
		expect(groupPhase({ ...base, startDate: '2026-07-10', expenseCount: 1 }, today)).toBe('active');
	});
	it('has ended the day after the end date', () => {
		expect(groupPhase({ ...base, endDate: '2026-07-10', expenseCount: 2 }, today)).toBe('active');
		expect(groupPhase({ ...base, endDate: '2026-07-09', expenseCount: 2 }, today)).toBe('ended');
		expect(groupPhase({ ...base, endDate: '2026-07-09' }, today)).toBe('ended');
	});
	it('is settled with the final statement, square once all is paid', () => {
		expect(groupPhase({ ...base, status: 'settled', openTransfers: 2 }, today)).toBe('settled');
		expect(groupPhase({ ...base, status: 'settled', openTransfers: 0 }, today)).toBe('square');
	});
	it('archived wins', () => {
		expect(groupPhase({ ...base, status: 'settled', archivedAt: new Date() }, today)).toBe('archived');
	});
});
