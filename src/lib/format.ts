import { formatAmount } from './core/currency';

export { formatAmount };

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
	return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('de-DE', opts);
}

export function today(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO date `days` after `iso` (days may be negative). */
export function addDays(iso: string, days: number): string {
	const d = new Date(iso + 'T12:00:00Z');
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
