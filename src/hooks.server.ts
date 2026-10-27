import type { Handle, ServerInit } from '@sveltejs/kit';
import { runMigrations } from '$lib/server/db';
import { seedDefaults } from '$lib/server/defaults';
import { refreshRatesIfStale } from '$lib/server/rates';
import { SESSION_COOKIE, validateSession } from '$lib/server/auth/session';

export const init: ServerInit = async () => {
	await runMigrations();
	await seedDefaults();
	void refreshRatesIfStale();
	setInterval(() => void refreshRatesIfStale(), 3_600_000).unref();
};

export const handle: Handle = async ({ event, resolve }) => {
	const result = await validateSession(event.cookies.get(SESSION_COOKIE));
	event.locals.user = result?.user ?? null;
	event.locals.sessionId = result?.sessionId ?? null;
	return resolve(event);
};
