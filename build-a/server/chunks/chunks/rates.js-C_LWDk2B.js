import { and, eq, lte, desc } from 'drizzle-orm';
import { d as db, e as exchangeRates } from './index3.js-LeA4cvVT.js';

const ECB_90D = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";
async function refreshEcbRates() {
  const res = await fetch(ECB_90D, { signal: AbortSignal.timeout(15e3) });
  if (!res.ok) throw new Error(`ECB: HTTP ${res.status}`);
  const xml = await res.text();
  const rows = [];
  const dayRe = /<Cube time=['"](\d{4}-\d{2}-\d{2})['"]>([\s\S]*?)<\/Cube>/g;
  const rateRe = /<Cube currency=['"]([A-Z]{3})['"] rate=['"]([\d.]+)['"]\s*\/>/g;
  for (const [, date, body] of xml.matchAll(dayRe)) {
    for (const [, currency, rate] of body.matchAll(rateRe)) {
      rows.push({ date, currency, perEur: parseFloat(rate) });
    }
  }
  if (rows.length) await db.insert(exchangeRates).values(rows).onConflictDoNothing();
  return rows.length;
}
let lastRefresh = 0;
async function refreshRatesIfStale() {
  if (Date.now() - lastRefresh < 6 * 36e5) return;
  lastRefresh = Date.now();
  try {
    await refreshEcbRates();
  } catch (e) {
    console.warn("Wechselkurse konnten nicht geladen werden:", e.message);
  }
}
async function perEur(currency, date) {
  if (currency === "EUR") return { perEur: 1, date };
  const [row] = await db.select().from(exchangeRates).where(and(eq(exchangeRates.currency, currency), lte(exchangeRates.date, date))).orderBy(desc(exchangeRates.date)).limit(1);
  if (row) return { perEur: row.perEur, date: row.date };
  const [oldest] = await db.select().from(exchangeRates).where(eq(exchangeRates.currency, currency)).orderBy(exchangeRates.date).limit(1);
  return oldest ? { perEur: oldest.perEur, date: oldest.date } : null;
}
async function lookupRate(from, base, date) {
  if (from === base) return { rate: 1, rateDate: date, provisional: false };
  const [f, b] = await Promise.all([perEur(from, date), perEur(base, date)]);
  if (!f || !b) return null;
  const rateDate = f.date < b.date ? f.date : b.date;
  const ageDays = (Date.parse(date) - Date.parse(rateDate)) / 864e5;
  return { rate: b.perEur / f.perEur, rateDate, provisional: ageDays > 4 || ageDays < 0 };
}
async function knownCurrencies() {
  const rows = await db.selectDistinct({ c: exchangeRates.currency }).from(exchangeRates);
  return ["EUR", ...rows.map((r) => r.c).sort()];
}
const commonCurrencies = ["EUR", "CHF", "GBP", "USD", "DKK", "SEK", "NOK", "PLN", "CZK", "HUF", "HRK", "TRY", "JPY"];

export { commonCurrencies as c, knownCurrencies as k, lookupRate as l, refreshRatesIfStale as r };
//# sourceMappingURL=rates.js-C_LWDk2B.js.map
