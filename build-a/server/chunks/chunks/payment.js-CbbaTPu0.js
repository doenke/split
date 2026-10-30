import { c as currencyDigits } from './currency.js-B45uFFG3.js';

function normalizeIban(iban) {
  return iban.replace(/\s+/g, "").toUpperCase();
}
function isValidIban(input) {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  return rest === 1;
}
function formatIban(iban) {
  return normalizeIban(iban).replace(/(.{4})/g, "$1 ").trim();
}
function normalizePaypalMe(input) {
  const s = input.trim().replace(/^https?:\/\//, "").replace(/^(www\.)?paypal\.me\//i, "").split(/[/?#]/)[0];
  return /^[A-Za-z0-9]{1,30}$/.test(s) ? s : null;
}
function major(amount, currency) {
  const d = currencyDigits(currency);
  return (amount / 10 ** d).toFixed(d);
}
function paypalLink(name, amount, currency) {
  return `https://paypal.me/${encodeURIComponent(name)}/${major(amount, currency)}${currency}`;
}
function epcPayload(data) {
  const clean = (s, max) => s.replace(/[\r\n]+/g, " ").trim().slice(0, max);
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    "",
    // BIC is optional within the EEA
    clean(data.name, 70),
    normalizeIban(data.iban),
    "EUR" + major(data.amount, "EUR"),
    "",
    // purpose
    "",
    // structured reference
    clean(data.text, 140)
  ].join("\n");
}

export { normalizeIban as a, epcPayload as e, formatIban as f, isValidIban as i, normalizePaypalMe as n, paypalLink as p };
//# sourceMappingURL=payment.js-CbbaTPu0.js.map
