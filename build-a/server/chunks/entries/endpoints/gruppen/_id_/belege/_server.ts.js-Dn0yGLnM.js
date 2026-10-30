import { C as error, j as json } from '../../../../../chunks/utils.js-BjQHIhHk.js';
import { r as requireGroup } from '../../../../../chunks/groups.js-By2r4Rg8.js';
import { s as storeUpload, U as UploadError } from '../../../../../chunks/uploads.js-Cm1gopuF.js';
import '../../../../../chunks/utils2.js-ejsMtG81.js';
import 'drizzle-orm';
import '../../../../../chunks/split.js-Diu3SqNm.js';
import '../../../../../chunks/index3.js-LeA4cvVT.js';
import 'drizzle-orm/postgres-js';
import 'drizzle-orm/postgres-js/migrator';
import 'postgres';
import '../../../../../chunks/shared-server.js-D1aJpbsf.js';
import 'drizzle-orm/pg-core';
import 'node:fs/promises';
import 'node:path';
import '../../../../../chunks/ids.js-2U6-pnrm.js';
import 'node:crypto';

const POST = async ({ params, locals, request }) => {
  const g = await requireGroup(params.id, locals.user);
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) error(400, "Keine Datei.");
  try {
    const id = await storeUpload(file, params.id, g.user.id);
    return json({ id, mime: file.type });
  } catch (e) {
    if (e instanceof UploadError) return json({ message: e.message }, { status: 400 });
    throw e;
  }
};

export { POST };
//# sourceMappingURL=_server.ts.js-Dn0yGLnM.js.map
