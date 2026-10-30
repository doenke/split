import { j as json } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { r as requireGroup } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { l as lookupRate } from '../../../../../chunks/rates.js-C_LWDk2B.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm';
import '../../../../../chunks/split.js-Diu3SqNm.js';
import '../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';

const GET = async ({ params, locals, url }) => {
  const { group } = await requireGroup(params.id, locals.user);
  const currency = url.searchParams.get("currency") ?? "";
  const date = url.searchParams.get("date") ?? "";
  if (!/^[A-Z]{3}$/.test(currency) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ message: "Ungültige Anfrage" }, { status: 400 });
  }
  const rate = await lookupRate(currency, group.baseCurrency, date);
  if (!rate) return json({ message: `Kein Kurs für ${currency} bekannt – bitte manuell angeben.` }, { status: 404 });
  return json(rate);
};

export { GET };
//# sourceMappingURL=_server.ts.js-BHPOId-M.js.map
