import type { ExpenseInput } from './expense-input';

/** Expenses captured without a connection, waiting to be sent. Lives in IndexedDB. */
export interface PendingExpense {
	clientId: string;
	groupId: string;
	payload: ExpenseInput;
	createdAt: number;
	/** set when the server rejected it (e.g. invalid) – needs attention */
	error?: string;
}

const DB = 'split-offline';
const STORE = 'expenses';

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'clientId' });
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await open();
	return new Promise((resolve, reject) => {
		const req = fn(db.transaction(STORE, mode).objectStore(STORE));
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function queueExpense(groupId: string, payload: ExpenseInput) {
	const item: PendingExpense = { clientId: payload.clientId!, groupId, payload, createdAt: Date.now() };
	await run('readwrite', (s) => s.put(item));
	window.dispatchEvent(new CustomEvent('split:pending'));
}

export async function pendingExpenses(groupId?: string): Promise<PendingExpense[]> {
	try {
		const all = await run<PendingExpense[]>('readonly', (s) => s.getAll());
		return all.filter((p) => !groupId || p.groupId === groupId).sort((a, b) => a.createdAt - b.createdAt);
	} catch {
		return [];
	}
}

export async function discardPending(clientId: string) {
	await run('readwrite', (s) => s.delete(clientId));
	window.dispatchEvent(new CustomEvent('split:pending'));
}

let flushing = false;

/** Sends all queued expenses. Returns how many were saved. */
export async function flushPending(): Promise<number> {
	if (flushing || !navigator.onLine) return 0;
	flushing = true;
	let saved = 0;
	try {
		for (const item of await pendingExpenses()) {
			if (item.error) continue;
			let res: Response;
			try {
				res = await fetch(`/gruppen/${item.groupId}/ausgaben/sync`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(item.payload)
				});
			} catch {
				break; // still offline
			}
			if (res.ok) {
				await run('readwrite', (s) => s.delete(item.clientId));
				saved++;
			} else if (res.status >= 400 && res.status < 500 && res.status !== 401) {
				const message = (await res.json().catch(() => null))?.message ?? `Fehler ${res.status}`;
				await run('readwrite', (s) => s.put({ ...item, error: message }));
			}
		}
	} finally {
		flushing = false;
		window.dispatchEvent(new CustomEvent('split:pending'));
	}
	return saved;
}
