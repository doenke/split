const digitsCache = /* @__PURE__ */ new Map();
function currencyDigits(currency) {
  let d = digitsCache.get(currency);
  if (d === void 0) {
    try {
      d = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    } catch {
      d = 2;
    }
    digitsCache.set(currency, d);
  }
  return d;
}
function convert(amount, from, base, rate) {
  if (from === base) return amount;
  const major = amount / 10 ** currencyDigits(from);
  return Math.round(major * rate * 10 ** currencyDigits(base));
}
function rateFromCharged(amount, from, charged, base) {
  const major = amount / 10 ** currencyDigits(from);
  const chargedMajor = charged / 10 ** currencyDigits(base);
  return chargedMajor / major;
}
function parseAmount(input, currency) {
  let s = input.trim().replace(/\s|€/g, "");
  if (!s) return null;
  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const decimalSep = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;
  if (decimalSep) {
    const other = decimalSep === "," ? "." : ",";
    const [intPart, frac] = [s.slice(0, s.lastIndexOf(decimalSep)), s.slice(s.lastIndexOf(decimalSep) + 1)];
    if (decimalSep === "." && !s.includes(",") && frac.length === 3 && intPart.length > 0) {
      s = intPart + frac;
    } else {
      s = intPart.split(other).join("") + "." + frac;
    }
  }
  if (!/^\d*(\.\d*)?$/.test(s) || s === ".") return null;
  const digits = currencyDigits(currency);
  const value = Math.round(parseFloat(s) * 10 ** digits);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}
function formatAmount(amount, currency, locale = "de-DE") {
  const digits = currencyDigits(currency);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 10 ** digits);
}
function amountToInput(amount, currency) {
  const digits = currencyDigits(currency);
  return (amount / 10 ** digits).toFixed(digits).replace(".", ",");
}

export { convert as a, amountToInput as b, currencyDigits as c, formatAmount as f, parseAmount as p, rateFromCharged as r };
//# sourceMappingURL=currency.js-B45uFFG3.js.map
