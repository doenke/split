import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const url = env.DATABASE_URL ?? 'postgres://split:split@localhost:5432/split';

export const client = postgres(url, { max: 10, onnotice: () => {} });
export const db = drizzle(client, { schema });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];

export async function runMigrations() {
	await migrate(db, { migrationsFolder: env.MIGRATIONS_DIR ?? 'drizzle' });
}

export { schema };
