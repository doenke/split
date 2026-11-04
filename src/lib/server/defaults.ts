import { db, schema } from './db';

export const defaultCategories = [
	{ id: 'food', name: 'Restaurant & Kneipe', icon: '🍽️', color: '#e76f51' },
	{ id: 'groceries', name: 'Lebensmittel', icon: '🛒', color: '#2a9d8f' },
	{ id: 'accommodation', name: 'Unterkunft', icon: '🏠', color: '#264653' },
	{ id: 'transport', name: 'Transport', icon: '🚆', color: '#00798c' },
	{ id: 'fuel', name: 'Sprit', icon: '⛽', color: '#edae49' },
	{ id: 'activities', name: 'Aktivitäten', icon: '🎯', color: '#8e7dbe' },
	{ id: 'tickets', name: 'Eintritt', icon: '🎟️', color: '#d1495b' }
];

export async function seedDefaults() {
	await db
		.insert(schema.categories)
		.values(defaultCategories.map((c, i) => ({ ...c, groupId: null, sort: i })))
		.onConflictDoNothing();
}
