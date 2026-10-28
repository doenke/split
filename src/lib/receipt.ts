/** What the receipt recognition returns. Amounts in minor units of `currency`. */
export interface ReceiptRecognition {
	merchant: string | null;
	date: string | null;
	currency: string | null;
	total: number | null;
	items: { description: string; amount: number }[];
	categoryId: string | null;
	/** indices of items the user deselected (private) */
	deselected?: number[];
	/** set when the recognition failed or was not possible */
	error?: string;
}

/** Sum of the recognized items and the difference to the receipt total (e.g. deposit, rounding). */
export function receiptDifference(r: ReceiptRecognition): number {
	if (r.total === null) return 0;
	return r.total - r.items.reduce((s, i) => s + i.amount, 0);
}
