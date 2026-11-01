import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { mailKinds, verifyToken } from '$lib/server/mail';
import type { Actions, PageServerLoad } from './$types';

async function parse(token: string) {
	const parts = await verifyToken(token);
	if (!parts || parts[0] !== 'unsub') return null;
	const kind = mailKinds.find((k) => k.key === parts[2]);
	return kind ? { personId: parts[1], kind } : null;
}

/** Unsubscribe link from an e-mail: works without logging in, the signed token says who and what. */
export const load: PageServerLoad = async ({ url }) => {
	const t = url.searchParams.get('t') ?? '';
	const p = await parse(t);
	return p ? { token: t, label: p.kind.label } : { token: null, label: null };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const p = await parse(String((await request.formData()).get('t') ?? ''));
		if (!p) return fail(400, { message: 'Der Link ist ungültig.' });
		const [person] = await db.select({ prefs: schema.persons.mailPrefs }).from(schema.persons).where(eq(schema.persons.id, p.personId));
		if (!person) return fail(400, { message: 'Der Link ist ungültig.' });
		await db
			.update(schema.persons)
			.set({ mailPrefs: { ...person.prefs, [p.kind.key]: false } })
			.where(eq(schema.persons.id, p.personId));
		return { done: true };
	}
};
