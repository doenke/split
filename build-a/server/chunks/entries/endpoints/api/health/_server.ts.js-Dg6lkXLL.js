import { j as json } from '../../../../chunks/utils.js-BjQHIhHk.js';
import { w as client } from '../../../../chunks/index3.js-LeA4cvVT.js';
import { c as commit, v as version } from '../../../../chunks/version.js-D_0qsEMc.js';
import { u as uploadsWritable } from '../../../../chunks/uploads.js-Cm1gopuF.js';
import '../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import 'node:fs/promises';
import 'node:path';
import 'drizzle-orm';
import '../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const GET = async () => {
  try {
    await client`select 1`;
    const uploads = await uploadsWritable() ? "ok" : "not writable";
    return json({ status: "ok", db: "ok", uploads, version, commit });
  } catch {
    return json({ status: "error", db: "unreachable", version, commit }, { status: 503 });
  }
};

export { GET };
//# sourceMappingURL=_server.ts.js-Dg6lkXLL.js.map
