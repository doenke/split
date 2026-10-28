import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db';
import { commit, version } from '$lib/version';
import { uploadsWritable } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

/** Readiness: server is up and the database is reachable (uploads only reported, not required). */
export const GET: RequestHandler = async () => {
	try {
		await client`select 1`;
		const uploads = (await uploadsWritable()) ? 'ok' : 'not writable';
		return json({ status: 'ok', db: 'ok', uploads, version, commit });
	} catch {
		return json({ status: 'error', db: 'unreachable', version, commit }, { status: 503 });
	}
};
