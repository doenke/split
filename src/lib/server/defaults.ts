import { db, schema } from './db';

export const defaultCategories = [
	{ id: 'food', name: 'Restaurant & Kneipe', icon: '🍽️', color: '#e76f51' },
	{ id: 'groceries', name: 'Lebensmittel', icon: '🛒', color: '#2a9d8f' },
	{ id: 'accommodation', name: 'Unterkunft', icon: '🏠', color: '#264653' },
	{ id: 'transport', name: 'Transport', icon: '🚆', color: '#00798c' },
	{ id: 'tickets', name: 'Eintritt', icon: '🎟️', color: '#d1495b' },
	{ id: 'alcohol', name: 'Alkohol', icon: '🍺', color: '#e9a23b' }
];

/** Profiles a new, empty group starts with. */
export const defaultProfiles = [{ name: 'Alkohol', icon: '🍺', rule: { type: 'adults' as const }, defaultCategoryId: 'alcohol' }];

export async function seedDefaults() {
	await db
		.insert(schema.categories)
		.values(defaultCategories.map((c, i) => ({ ...c, groupId: null, sort: i })))
		.onConflictDoNothing();
}
