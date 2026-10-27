import { and, desc, eq, inArray, lte } from 'drizzle-orm';
import { db, schema } from './db';

const ECB_90D = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml';

/** Fetches the ECB reference rates of the last 90 days and stores them. */
export async function refreshEcbRates(): Promise<number> {
	const res = await fetch(ECB_90D, { signal: AbortSignal.timeout(15_000) });
	if (!res.ok) throw new Error(`ECB: HTTP ${res.status}`);
	const xml = await res.text();
	const rows: { date: string; currency: string; perEur: number }[] = [];
	const dayRe = /<Cube time=['"](\d{4}-\d{2}-\d{2})['"]>([\s\S]*?)<\/Cube>/g;
	const rateRe = /<Cube currency=['"]([A-Z]{3})['"] rate=['"]([\d.]+)['"]\s*\/>/g;
	for (const [, date, body] of xml.matchAll(dayRe)) {
		for (const [, currency, rate] of body.matchAll(rateRe)) {
			rows.push({ date, currency, perEur: parseFloat(rate) });
		}
	}
	if (rows.length) await db.insert(schema.exchangeRates).values(rows).onConflictDoNothing();
	return rows.length;
}

let lastRefresh = 0;

/** Refreshes rates at most every 6 hours; never throws. */
export async function refreshRatesIfStale() {
	if (Date.now() - lastRefresh < 6 * 3_600_000) return;
	lastRefresh = Date.now();
	try {
		await refreshEcbRates();
	} catch (e) {
		console.warn('Wechselkurse konnten nicht geladen werden:', (e as Error).message);
	}
}

async function perEur(currency: string, date: string): Promise<{ perEur: number; date: string } | null> {
	if (currency === 'EUR') return { perEur: 1, date };
	const [row] = await db
		.select()
		.from(schema.exchangeRates)
		.where(and(eq(schema.exchangeRates.currency, currency), lte(schema.exchangeRates.date, date)))
		.orderBy(desc(schema.exchangeRates.date))
		.limit(1);
	if (row) return { perEur: row.perEur, date: row.date };
	// date older than our data: take the oldest known rate
	const [oldest] = await db
		.select()
		.from(schema.exchangeRates)
		.where(eq(schema.exchangeRates.currency, currency))
		.orderBy(schema.exchangeRates.date)
		.limit(1);
	return oldest ? { perEur: oldest.perEur, date: oldest.date } : null;
}

/**
 * Rate to convert `from` into `base` on `date` (base units per 1 `from`).
 * `provisional` is set when no rate for that exact day was available.
 */
export async function lookupRate(from: string, base: string, date: string) {
	if (from === base) return { rate: 1, rateDate: date, provisional: false };
	const [f, b] = await Promise.all([perEur(from, date), perEur(base, date)]);
	if (!f || !b) return null;
	const rateDate = f.date < b.date ? f.date : b.date;
	// ECB publishes no rates on weekends/holidays: up to 4 days old counts as exact
	const ageDays = (Date.parse(date) - Date.parse(rateDate)) / 86_400_000;
	return { rate: b.perEur / f.perEur, rateDate, provisional: ageDays > 4 || ageDays < 0 };
}

export async function knownCurrencies(): Promise<string[]> {
	const rows = await db.selectDistinct({ c: schema.exchangeRates.currency }).from(schema.exchangeRates);
	return ['EUR', ...rows.map((r) => r.c).sort()];
}

export const commonCurrencies = ['EUR', 'CHF', 'GBP', 'USD', 'DKK', 'SEK', 'NOK', 'PLN', 'CZK', 'HUF', 'HRK', 'TRY', 'JPY'];

export async function latestRates(currencies: string[]) {
	return db
		.select()
		.from(schema.exchangeRates)
		.where(inArray(schema.exchangeRates.currency, currencies))
		.orderBy(desc(schema.exchangeRates.date))
		.limit(currencies.length * 5);
}
