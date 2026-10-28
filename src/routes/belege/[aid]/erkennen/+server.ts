import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { loadCategories, requireGroup } from '$lib/server/groups';
import { receiptRecognitionEnabled, recognizeReceipt } from '$lib/server/receipts';
import type { RequestHandler } from './$types';

/** Runs the receipt recognition for an uploaded receipt (once; later calls return the stored result). */
export const POST: RequestHandler = async ({ params, locals }) => {
	const [a] = await db.select().from(schema.attachments).where(eq(schema.attachments.id, params.aid));
	if (!a) error(404, 'Beleg nicht gefunden.');
	const g = await requireGroup(a.groupId, locals.user);
	if (!receiptRecognitionEnabled()) return json({ message: 'Die Bon-Erkennung ist nicht eingerichtet.' }, { status: 501 });
	try {
		const categories = (await loadCategories(a.groupId)).filter((c) => !c.hidden);
		return json(await recognizeReceipt(a.id, categories, g.group.baseCurrency));
	} catch (e) {
		return json({ message: (e as Error).message }, { status: 503 });
	}
};
