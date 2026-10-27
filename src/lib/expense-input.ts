import type { SplitRule } from './core/types';

/** What the expense form submits (amounts in minor units of `currency`). */
export interface ExpenseInput {
	type: 'expense' | 'income';
	title: string;
	amount: number;
	currency: string;
	date: string;
	payers: { personId: string; amount: number }[];
	categoryId: string | null;
	profileId: string | null;
	rule: SplitRule;
	privateAmount: number;
	rate: { source: 'auto' | 'manual' | 'charged'; value?: number; charged?: number };
	period: { from: string; to: string; unit: 'days' | 'nights' } | null;
	notes: string;
	/** uploaded receipts to attach */
	attachmentIds?: string[];
}
