import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { verifyToken } from '$lib/server/mail';
import type { PageServerLoad } from './$types';

/** Link from the confirmation e-mail: the address belongs to the person. */
export const load: PageServerLoad = async ({ url }) => {
	const parts = await verifyToken(url.searchParams.get('t') ?? '');
	if (!parts || parts[0] !== 'confirm') return { ok: false, message: 'Der Link ist ungültig.' };
	const [, personId, email, expires] = parts;
	if (Number(expires) < Date.now()) return { ok: false, message: 'Der Link ist abgelaufen. Lass dir im Profil einen neuen schicken.' };
	const updated = await db
		.update(schema.persons)
		.set({ emailVerified: true })
		.where(and(eq(schema.persons.id, personId), eq(schema.persons.email, email)))
		.returning({ id: schema.persons.id });
	if (!updated.length) return { ok: false, message: 'Die Adresse wurde inzwischen geändert. Bitte bestätige die neue.' };
	return { ok: true, email };
};
