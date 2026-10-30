import { l as auditLog } from './index3.js-LeA4cvVT.js';
import { n as newId } from './ids.js-2U6-pnrm.js';

async function audit(tx, entry) {
  await tx.insert(auditLog).values({
    id: newId(),
    groupId: entry.groupId,
    personId: entry.personId,
    action: entry.action,
    entityId: entry.entityId ?? null,
    data: entry.data ?? null
  });
}

export { audit as a };
//# sourceMappingURL=audit.js-DeGbxmfN.js.map
