import type { Handle, ServerInit } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runMigrations } from '$lib/server/db';
import { refreshDisplayNames } from '$lib/server/display';
import { seedDefaults } from '$lib/server/defaults';
import { refreshRatesIfStale } from '$lib/server/rates';
import { cleanupOrphans } from '$lib/server/uploads';
import { purgeTrash } from '$lib/server/trash';
import { runMailJobs } from '$lib/server/mailings';
import { SESSION_COOKIE, validateSession } from '$lib/server/auth/session';

export const init: ServerInit = async () => {
	await runMigrations();
	if (env.OIDC_BUTTON_LABEL && !env.OIDC_PROVIDER_NAME)
		console.warn('OIDC_BUTTON_LABEL ist veraltet – bitte stattdessen OIDC_PROVIDER_NAME setzen (z. B. "Pocket ID"); der Button heißt dann „Mit Pocket ID anmelden“.');
	await refreshDisplayNames();
	await seedDefaults();
	void refreshRatesIfStale();
	// reminders also shortly after a restart (each one is sent at most weekly anyway)
	setTimeout(() => void runMailJobs().catch((e) => console.warn('E-Mail-Erinnerungen fehlgeschlagen:', e)), 30_000).unref();
	setInterval(() => {
		void refreshRatesIfStale();
		void cleanupOrphans().catch((e) => console.warn('Aufräumen der Belege fehlgeschlagen:', e));
		void purgeTrash().catch((e) => console.warn('Leeren des Papierkorbs fehlgeschlagen:', e));
		void runMailJobs().catch((e) => console.warn('E-Mail-Erinnerungen fehlgeschlagen:', e));
	}, 3_600_000).unref();
};

export const handle: Handle = async ({ event, resolve }) => {
	const result = await validateSession(event.cookies.get(SESSION_COOKIE));
	event.locals.user = result?.user ?? null;
	event.locals.sessionId = result?.sessionId ?? null;
	const response = await resolve(event);
	// pages are never served from the browser's HTTP cache, so an update shows up right away
	if (response.headers.get('content-type')?.startsWith('text/html')) {
		response.headers.set('cache-control', 'no-cache');
	}
	return response;
};
