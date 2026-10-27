import { createHash, randomBytes } from 'node:crypto';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** Random, URL-safe id without ambiguous characters. */
export function newId(length = 16): string {
	const bytes = randomBytes(length);
	let out = '';
	for (const b of bytes) out += alphabet[b % alphabet.length];
	return out;
}

/** Secret token (for cookies and invite links). Only its hash is stored. */
export function newToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('base64url');
}
