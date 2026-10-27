import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Liveness: the process is running (no database check). */
export const GET: RequestHandler = () => json({ status: 'ok' });
