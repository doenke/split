import { error } from '@sveltejs/kit';
import { readAvatar } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

const types: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Profile pictures uploaded in Split – visible to everyone logged in. */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401);
	const type = types[params.file.split('.').pop() ?? ''];
	if (!type) error(404);
	const body = await readAvatar(params.file).catch(() => error(404, 'Bild fehlt.'));
	return new Response(new Uint8Array(body), {
		headers: { 'content-type': type, 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' }
	});
};
