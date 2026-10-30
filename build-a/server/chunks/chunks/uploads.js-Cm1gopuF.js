import { rm, mkdir, access, constants, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, isNull, lt, eq } from 'drizzle-orm';
import { b as private_env } from './shared-server.js-D1aJpbsf.js';
import { d as db, a as attachments } from './index3.js-LeA4cvVT.js';
import { n as newId } from './ids.js-2U6-pnrm.js';

const MAX_BYTES = 15 * 1024 * 1024;
const allowed = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf"
};
class UploadError extends Error {
}
const dir = () => private_env.UPLOAD_DIR ?? path.resolve("data/uploads");
async function storeUpload(file, groupId, userId) {
  const ext = allowed[file.type];
  if (!ext) throw new UploadError("Nur Fotos (JPEG, PNG, WebP, HEIC) und PDFs sind erlaubt.");
  if (file.size > MAX_BYTES) throw new UploadError("Die Datei ist zu groß (max. 15 MB).");
  const id = newId();
  const fileName = `${id}.${ext}`;
  try {
    await mkdir(dir(), { recursive: true });
    await writeFile(path.join(dir(), fileName), Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    console.error(`Beleg konnte nicht in ${dir()} gespeichert werden:`, e);
    throw new UploadError("Der Beleg konnte auf dem Server nicht gespeichert werden (Upload-Ordner nicht beschreibbar?).");
  }
  await db.insert(attachments).values({
    id,
    groupId,
    fileName,
    originalName: file.name?.slice(0, 200) || null,
    mime: file.type,
    size: file.size,
    uploadedBy: userId
  });
  return id;
}
async function readUpload(fileName) {
  return readFile(path.join(dir(), path.basename(fileName)));
}
async function deleteUpload(id) {
  const [a] = await db.delete(attachments).where(eq(attachments.id, id)).returning();
  if (a) await rm(path.join(dir(), a.fileName), { force: true });
}
async function cleanupOrphans() {
  const old = await db.select().from(attachments).where(and(isNull(attachments.expenseId), lt(attachments.createdAt, new Date(Date.now() - 864e5))));
  for (const a of old) await deleteUpload(a.id);
}
async function uploadsWritable() {
  try {
    await mkdir(dir(), { recursive: true });
    await access(dir(), constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export { UploadError as U, cleanupOrphans as c, deleteUpload as d, readUpload as r, storeUpload as s, uploadsWritable as u };
//# sourceMappingURL=uploads.js-Cm1gopuF.js.map
