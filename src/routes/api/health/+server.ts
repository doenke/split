import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db';
import pkg from '../../../../package.json';
import type { RequestHandler } from './$types';

/** Readiness: server is up and the database is reachable. */
export const GET: RequestHandler = async () => {
	try {
		await client`select 1`;
		return json({ status: 'ok', db: 'ok', version: pkg.version });
	} catch {
		return json({ status: 'error', db: 'unreachable', version: pkg.version }, { status: 503 });
	}
};
