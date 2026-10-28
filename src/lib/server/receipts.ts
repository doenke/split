import Anthropic from '@anthropic-ai/sdk';
import { betaJSONSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { currencyDigits } from '$lib/core/currency';
import type { ReceiptRecognition } from '$lib/receipt';
import { db, schema } from './db';
import { readUpload } from './uploads';

const DEFAULT_MODEL = 'claude-opus-5-5';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/** Receipt recognition is on when an API key is configured (RECEIPT_OCR_ENGINE=none turns it off). */
export function receiptRecognitionEnabled() {
	const engine = env.RECEIPT_OCR_ENGINE ?? 'anthropic';
	return engine === 'anthropic' && Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

/** Already strict (all fields required, no extra properties), so it is sent as is – the SDK's transform would drop the enum. */
const schemaFor = (categoryIds: string[]) =>
	({
		type: 'object',
		properties: {
			is_receipt: { type: 'boolean', description: 'false if the image is not a receipt or invoice' },
			merchant: { type: ['string', 'null'], description: 'shop or restaurant name, short' },
			date: { type: ['string', 'null'], description: 'purchase date as YYYY-MM-DD' },
			currency: { type: ['string', 'null'], description: 'ISO 4217 code, e.g. EUR, CHF' },
			total: { type: ['number', 'null'], description: 'amount actually paid, in major units (e.g. 24.49)' },
			items: {
				type: 'array',
				description: 'line items in receipt order; discounts and deposit returns as negative amounts',
				items: {
					type: 'object',
					properties: {
						description: { type: 'string' },
						amount: { type: 'number', description: 'line total in major units' }
					},
					required: ['description', 'amount'],
					additionalProperties: false
				}
			},
			// "none" instead of null: enums on nullable types are not supported by structured outputs
			category_id: { type: 'string', enum: [...categoryIds, 'none'] }
		},
		required: ['is_receipt', 'merchant', 'date', 'currency', 'total', 'items', 'category_id'],
		additionalProperties: false
	}) as const;

/**
 * Reads a receipt (photo or PDF) with Claude and returns merchant, date, total, items and a
 * category suggestion. The result is stored on the attachment, so each receipt is read once.
 */
export async function recognizeReceipt(
	attachmentId: string,
	categories: { id: string; name: string }[],
	baseCurrency: string
): Promise<ReceiptRecognition> {
	const [a] = await db.select().from(schema.attachments).where(eq(schema.attachments.id, attachmentId));
	if (!a) throw new Error('Beleg nicht gefunden.');
	if (a.ocrStatus === 'done' && a.ocrResult) return a.ocrResult;

	const save = async (status: 'done' | 'failed' | 'skipped', result: ReceiptRecognition) => {
		await db.update(schema.attachments).set({ ocrStatus: status, ocrResult: result }).where(eq(schema.attachments.id, a.id));
		return result;
	};
	const empty: ReceiptRecognition = { merchant: null, date: null, currency: null, total: null, items: [], categoryId: null };

	const isPdf = a.mime === 'application/pdf';
	const imageType = IMAGE_TYPES.find((t) => t === a.mime);
	if (!isPdf && !imageType) {
		return save('skipped', { ...empty, error: 'Dieses Bildformat kann nicht gelesen werden (bitte JPEG oder PNG).' });
	}
	const data = (await readUpload(a.fileName)).toString('base64');

	const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join('\n');
	let parsed;
	try {
		const response = await anthropic().beta.messages.parse({
			model: env.RECEIPT_MODEL || DEFAULT_MODEL,
			max_tokens: 8000,
			betas: ['server-side-fallback-2026-07-01'],
			fallbacks: 'default',
			output_config: { effort: 'medium', format: betaJSONSchemaOutputFormat(schemaFor(categories.map((c) => c.id)), { transform: false }) },
			messages: [
				{
					role: 'user',
					content: [
						isPdf
							? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
							: { type: 'image', source: { type: 'base64', media_type: imageType!, data } },
						{
							type: 'text',
							text: `Read this receipt for an app that splits shared expenses within a travel group.

Extract the shop name, the purchase date, the currency and the total that was actually paid. List the line items as printed, with their line totals; put discounts, coupons and returned deposits ("Pfand") as negative items. Leave out lines that are not purchases (subtotals, tax summaries, payment method, change). If something is unreadable, use null instead of guessing.

If no currency is printed, assume ${baseCurrency}. Choose the best matching category id, or "none":
${categoryList}`
						}
					]
				}
			]
		});
		if (response.stop_reason === 'refusal') return save('failed', { ...empty, error: 'Der Bon konnte nicht gelesen werden.' });
		if (response.stop_reason === 'max_tokens') return save('failed', { ...empty, error: 'Der Bon ist zu lang zum Auslesen.' });
		parsed = response.parsed_output;
	} catch (e) {
		if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) {
			// temporary: do not store, the user can simply try again
			throw new Error('Die Bon-Erkennung ist gerade nicht erreichbar. Bitte später erneut versuchen.');
		}
		if (e instanceof Anthropic.AuthenticationError) {
			console.error('Bon-Erkennung: ungültiger API-Schlüssel');
			throw new Error('Die Bon-Erkennung ist falsch konfiguriert (API-Schlüssel).');
		}
		console.error('Bon-Erkennung fehlgeschlagen:', e);
		return save('failed', { ...empty, error: 'Der Bon konnte nicht gelesen werden.' });
	}
	if (!parsed) return save('failed', { ...empty, error: 'Der Bon konnte nicht gelesen werden.' });
	if (!parsed.is_receipt) return save('done', { ...empty, error: 'Das sieht nicht nach einem Kassenbon aus.' });

	const currency = parsed.currency && /^[A-Z]{3}$/.test(parsed.currency) ? parsed.currency : baseCurrency;
	const minor = (n: number) => Math.round(n * 10 ** currencyDigits(currency));
	const date = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
	return save('done', {
		merchant: parsed.merchant?.trim().slice(0, 80) || null,
		date,
		currency,
		total: parsed.total === null ? null : minor(parsed.total),
		items: parsed.items
			.filter((i) => i.description.trim())
			.slice(0, 200)
			.map((i) => ({ description: i.description.trim().slice(0, 120), amount: minor(i.amount) })),
		categoryId: categories.find((c) => c.id === parsed.category_id)?.id ?? null
	});
}
