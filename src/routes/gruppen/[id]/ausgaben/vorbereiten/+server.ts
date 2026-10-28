import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { loadCategories, requireGroup } from '$lib/server/groups';
import { newId } from '$lib/server/ids';
import { audit } from '$lib/server/audit';
import { storeUpload, UploadError } from '$lib/server/uploads';
import { receiptRecognitionEnabled, recognizeReceipt } from '$lib/server/receipts';
import { today } from '$lib/format';
import type { RequestHandler } from './$types';

/**
 * Photographed receipt → prepared expense ("draft"): only date, payer and the photo.
 * It is completed later (automatically read or by hand) and only then counts.
 */
export const POST: RequestHandler = async ({ params, locals, request }) => {
	const g = await requireGroup(params.id, locals.user);
	if (g.group.status === 'settled') error(400, 'Die Endabrechnung steht bereits.');
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) error(400, 'Kein Foto.');
	const date = /^\d{4}-\d{2}-\d{2}$/.test(String(form.get('date'))) ? String(form.get('date')) : today();

	let attachmentId: string;
	try {
		attachmentId = await storeUpload(file, params.id, g.user.id);
	} catch (e) {
		if (e instanceof UploadError) return json({ message: e.message }, { status: 400 });
		throw e;
	}
	const id = newId();
	await db.transaction(async (tx) => {
		await tx.insert(schema.expenses).values({
			id,
			groupId: params.id,
			status: 'draft',
			title: 'Bon',
			date,
			amount: 0,
			currency: g.group.baseCurrency,
			baseAmount: 0,
			createdBy: g.user.id
		});
		await tx.insert(schema.expensePayers).values({ expenseId: id, personId: g.user.id, amount: 0 });
		await tx.update(schema.attachments).set({ expenseId: id }).where(eq(schema.attachments.id, attachmentId));
		await audit(tx, { groupId: params.id, personId: g.user.id, action: 'expense.draft', entityId: id });
	});

	// read it in the background, so the result is ready when the user comes back to it
	if (receiptRecognitionEnabled()) {
		void loadCategories(params.id)
			.then((cats) => recognizeReceipt(attachmentId, cats.filter((c) => !c.hidden), g.group.baseCurrency))
			.catch((e) => console.warn('Bon-Erkennung im Hintergrund fehlgeschlagen:', (e as Error).message));
	}
	return json({ id });
};
