import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { canEditExpense, requireGroup } from '$lib/server/groups';
import { deleteUpload, readUpload } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

async function load(aid: string) {
	const [a] = await db.select().from(schema.attachments).where(eq(schema.attachments.id, aid));
	if (!a) error(404, 'Beleg nicht gefunden.');
	return a;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const a = await load(params.aid);
	await requireGroup(a.groupId, locals.user);
	const body = await readUpload(a.fileName).catch(() => error(404, 'Datei fehlt.'));
	return new Response(new Uint8Array(body), {
		headers: {
			'content-type': a.mime,
			'cache-control': 'private, max-age=31536000, immutable',
			'content-disposition': `inline; filename="${(a.originalName ?? a.fileName).replace(/"/g, '')}"`,
			'x-content-type-options': 'nosniff'
		}
	});
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const a = await load(params.aid);
	const g = await requireGroup(a.groupId, locals.user);
	if (a.uploadedBy !== g.user.id) {
		const [e] = a.expenseId
			? await db.select().from(schema.expenses).where(and(eq(schema.expenses.id, a.expenseId), eq(schema.expenses.groupId, a.groupId)))
			: [];
		if (!e || !canEditExpense(g, g.user.id, e)) error(403);
	}
	await deleteUpload(a.id);
	return new Response(null, { status: 204 });
};
