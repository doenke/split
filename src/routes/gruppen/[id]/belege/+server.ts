import { error, json } from '@sveltejs/kit';
import { requireGroup } from '$lib/server/groups';
import { storeUpload, UploadError } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

/** Uploads a receipt; it is linked to an expense when the expense is saved. */
export const POST: RequestHandler = async ({ params, locals, request }) => {
	const g = await requireGroup(params.id, locals.user);
	const file = (await request.formData()).get('file');
	if (!(file instanceof File)) error(400, 'Keine Datei.');
	try {
		const id = await storeUpload(file, params.id, g.user.id);
		return json({ id, mime: file.type });
	} catch (e) {
		if (e instanceof UploadError) return json({ message: e.message }, { status: 400 });
		throw e;
	}
};
