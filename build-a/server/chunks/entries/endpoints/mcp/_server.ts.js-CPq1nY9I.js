import { j as json } from '../../../chunks/utils.js-BjQHIhHk.js';
import { u as userForApiToken } from '../../../chunks/apitokens.js-Bu1DL5wo.js';
import { h as handleMcpMessage } from '../../../chunks/mcp.js-CNjp7RDo.js';
import '../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm';
import '../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import '../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';
import '../../../chunks/session.js-BTkwumJz.js';
import '../../../chunks/config.js-oO6Fsv50.js';
import '../../../chunks/currency.js-B45uFFG3.js';
import '../../../chunks/format.js-Cn5c-OM3.js';
import '../../../chunks/groups.js-By2r4Rg8.js';
import '../../../chunks/split.js-Diu3SqNm.js';
import '../../../chunks/expenses.js-CZuVyTN3.js';
import '../../../chunks/audit.js-DeGbxmfN.js';
import '../../../chunks/rates.js-C_LWDk2B.js';
import '../../../chunks/push.js-x-TdAYqk.js';
import 'web-push';
import '../../../chunks/closing.js-BokfKRie.js';
import '../../../chunks/settlements.js-7frSROs8.js';
import '../../../chunks/version.js-D_0qsEMc.js';

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, accept, mcp-session-id, mcp-protocol-version",
  "access-control-expose-headers": "mcp-session-id"
};
function keyOf(request, url) {
  const auth = request.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();
  return bearer || url.searchParams.get("key") || "";
}
const POST = async ({ request, url }) => {
  const user = await userForApiToken(keyOf(request, url));
  if (!user) {
    return json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Kein gültiger Split-API-Schlüssel. Erzeuge einen unter Profil → KI-Assistenten." } },
      { status: 401, headers: cors }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: cors });
  }
  const messages = Array.isArray(body) ? body : [body];
  const answers = (await Promise.all(messages.map((m) => handleMcpMessage(m, user)))).filter((a) => a !== null);
  if (!answers.length) return new Response(null, { status: 202, headers: cors });
  return json(Array.isArray(body) ? answers : answers[0], { headers: cors });
};
const notAllowed = () => new Response(null, { status: 405, headers: { ...cors, allow: "POST, OPTIONS" } });
const GET = notAllowed;
const DELETE = notAllowed;
const OPTIONS = () => new Response(null, { status: 204, headers: cors });

export { DELETE, GET, OPTIONS, POST };
//# sourceMappingURL=_server.ts.js-CPq1nY9I.js.map
