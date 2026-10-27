import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db';
import { commit, version } from '$lib/version';
import type { RequestHandler } from './$types';

/** Readiness: server is up and the database is reachable. */
export const GET: RequestHandler = async () => {
	try {
		await client`select 1`;
		return json({ status: 'ok', db: 'ok', version, commit });
	} catch {
		return json({ status: 'error', db: 'unreachable', version, commit }, { status: 503 });
	}
};
