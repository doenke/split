import type { SessionUser } from '$lib/server/auth/session';

declare global {
	const __APP_VERSION__: string;
	const __APP_COMMIT__: string;
	const __BUILD_DATE__: string;

	namespace App {
		interface Locals {
			user: SessionUser | null;
			sessionId: string | null;
		}
	}
}

export {};
