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
	/** foreign currency: the charged amount (credit card statement) is entered later */
	awaitingCharge?: boolean;
	/** everybody counts 1, regardless of their factors */
	equalWeights?: boolean;
	/** generated in the browser; the same id is never saved twice */
	clientId?: string;
	/** items of a recognized receipt that the user deselected (not shared) */
	receiptSelection?: { attachmentId: string; deselected: number[] };
	/** uploaded receipts to attach */
	attachmentIds?: string[];
}
