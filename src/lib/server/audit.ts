import { db, schema, type Tx } from './db';
import { newId } from './ids';

export async function audit(
	tx: Tx | typeof db,
	entry: { groupId: string | null; personId: string; action: string; entityId?: string; data?: unknown }
) {
	await tx.insert(schema.auditLog).values({
		id: newId(),
		groupId: entry.groupId,
		personId: entry.personId,
		action: entry.action,
		entityId: entry.entityId ?? null,
		data: entry.data ?? null
	});
}
