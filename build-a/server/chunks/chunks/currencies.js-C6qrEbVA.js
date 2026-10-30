import { k as knownCurrencies, c as commonCurrencies } from './rates.js-C_LWDk2B.js';

async function currencyOptions(base, used) {
  const known = await knownCurrencies();
  return [.../* @__PURE__ */ new Set([base, ...used, ...commonCurrencies, ...known])];
}

export { currencyOptions as c };
//# sourceMappingURL=currencies.js-C6qrEbVA.js.map
