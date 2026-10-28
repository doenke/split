import { access, constants, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db, schema } from './db';
import { newId } from './ids';

const MAX_BYTES = 15 * 1024 * 1024;
const allowed: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/heic': 'heic',
	'image/heif': 'heif',
	'application/pdf': 'pdf'
};

export class UploadError extends Error {}

const dir = () => env.UPLOAD_DIR ?? path.resolve('data/uploads');

export async function storeUpload(file: File, groupId: string, userId: string) {
	const ext = allowed[file.type];
	if (!ext) throw new UploadError('Nur Fotos (JPEG, PNG, WebP, HEIC) und PDFs sind erlaubt.');
	if (file.size > MAX_BYTES) throw new UploadError('Die Datei ist zu groß (max. 15 MB).');
	const id = newId();
	const fileName = `${id}.${ext}`;
	try {
		await mkdir(dir(), { recursive: true });
		await writeFile(path.join(dir(), fileName), Buffer.from(await file.arrayBuffer()));
	} catch (e) {
		console.error(`Beleg konnte nicht in ${dir()} gespeichert werden:`, e);
		throw new UploadError('Der Beleg konnte auf dem Server nicht gespeichert werden (Upload-Ordner nicht beschreibbar?).');
	}
	await db.insert(schema.attachments).values({
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

export async function readUpload(fileName: string) {
	return readFile(path.join(dir(), path.basename(fileName)));
}

export async function deleteUpload(id: string) {
	const [a] = await db.delete(schema.attachments).where(eq(schema.attachments.id, id)).returning();
	if (a) await rm(path.join(dir(), a.fileName), { force: true });
}

/** Removes uploads that never got attached to an expense (older than a day). */
export async function cleanupOrphans() {
	const old = await db
		.select()
		.from(schema.attachments)
		.where(and(isNull(schema.attachments.expenseId), lt(schema.attachments.createdAt, new Date(Date.now() - 86_400_000))));
	for (const a of old) await deleteUpload(a.id);
}

/** True when uploads can be stored (shown in /api/health). */
export async function uploadsWritable() {
	try {
		await mkdir(dir(), { recursive: true });
		await access(dir(), constants.W_OK);
		return true;
	} catch {
		return false;
	}
}
