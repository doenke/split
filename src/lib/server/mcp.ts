import { isHttpError } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { currencyDigits, parseAmount } from '$lib/core/currency';
import { today } from '$lib/format';
import type { ExpenseInput } from '$lib/expense-input';
import type { SplitRule } from '$lib/core/types';
import { db, schema } from './db';
import { loadCategories, loadExpenses, loadGroupState, requireGroup, type GroupMember } from './groups';
import { announceExpense, InputError, prepareExpense, saveExpense } from './expenses';
import { isClosed } from './closing';
import { paymentMethods, recordSettlement, SettlementError } from './settlements';
import { version } from '$lib/version';
import type { SessionUser } from './auth/session';

/**
 * A small MCP server (Model Context Protocol, Streamable HTTP without streaming): AI assistants can read
 * groups, balances and expenses and add expenses or payments – with exactly the rights of the key's owner.
 */

const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = `Split teilt gemeinsame Kosten in Gruppen (z.B. Reisen). Personen können in einer "Kasse" (z.B. Familie) zusammengefasst sein; Salden und Ausgleichszahlungen gelten pro Kasse.
Beträge werden in Haupteinheiten angegeben (z.B. 12.5 für 12,50 €). Personen können per Name oder ID angegeben werden.
Rufe zuerst list_groups auf, um die group_id zu bekommen. Trage Ausgaben nur ein, wenn der Nutzer es ausdrücklich möchte, und nenne danach kurz, was eingetragen wurde.`;

class ToolError extends Error {}

type Args = Record<string, unknown>;
interface Tool {
	name: string;
	title: string;
	description: string;
	inputSchema: Record<string, unknown>;
	annotations?: Record<string, unknown>;
	run: (args: Args, user: SessionUser) => Promise<unknown>;
}

const groupId = { type: 'string', description: 'ID der Gruppe (aus list_groups)' };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
const major = (minor: number, currency: string) => minor / 10 ** currencyDigits(currency);

/** Turns an amount in major units (number or "12,50") into minor units. */
function toMinor(v: unknown, currency: string) {
	const n = typeof v === 'number' ? Math.round(v * 10 ** currencyDigits(currency)) : parseAmount(String(v ?? ''), currency);
	if (n === null || !Number.isFinite(n) || n <= 0) throw new ToolError('Ungültiger Betrag.');
	return n;
}

/** Finds a member by ID, full name, first name or the beginning of the name – unambiguously. */
function findMember(members: GroupMember[], ref: unknown) {
	const r = str(ref);
	if (!r) throw new ToolError('Person fehlt.');
	const byId = members.find((m) => m.personId === r);
	if (byId) return byId;
	const n = norm(r);
	for (const match of [
		(m: GroupMember) => norm(m.name) === n,
		(m: GroupMember) => norm(m.name).split(' ')[0] === n,
		(m: GroupMember) => norm(m.name).startsWith(n)
	]) {
		const found = members.filter(match);
		if (found.length === 1) return found[0];
		if (found.length > 1) throw new ToolError(`„${r}“ ist nicht eindeutig: ${found.map((m) => m.name).join(', ')}.`);
	}
	throw new ToolError(`„${r}“ ist kein Mitglied dieser Gruppe. Mitglieder: ${members.map((m) => m.name).join(', ')}.`);
}

async function groupFor(id: unknown, user: SessionUser) {
	const gid = str(id);
	if (!gid) throw new ToolError('group_id fehlt.');
	return requireGroup(gid, user);
}

const tools: Tool[] = [
	{
		name: 'list_groups',
		title: 'Gruppen auflisten',
		description: 'Alle Gruppen des Nutzers mit Status und seinem aktuellen Saldo (positiv = bekommt Geld).',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
		async run(_args, user) {
			const rows = await db
				.select({ group: schema.groups, kasseId: schema.memberships.kasseId })
				.from(schema.memberships)
				.innerJoin(schema.groups, eq(schema.groups.id, schema.memberships.groupId))
				.where(and(eq(schema.memberships.personId, user.id), isNull(schema.groups.deletedAt)));
			return Promise.all(
				rows.map(async ({ group, kasseId }) => {
					const state = await loadGroupState(group.id);
					const balance = state.balances.kassen.get(kasseId)?.balance ?? 0;
					return {
						id: group.id,
						name: group.name,
						emoji: group.emoji,
						status: { active: 'laufend', settled: 'abgerechnet', archived: 'archiviert' }[group.status],
						currency: group.baseCurrency,
						members: state.members.length,
						my_balance: major(balance, group.baseCurrency)
					};
				})
			);
		}
	},
	{
		name: 'get_group',
		title: 'Gruppe mit Salden',
		description:
			'Details einer Gruppe: Mitglieder (mit Faktor und Kasse), Salden pro Kasse, vorgeschlagene Ausgleichszahlungen, Kategorien und Ausgaben-Profile.',
		inputSchema: { type: 'object', properties: { group_id: groupId }, required: ['group_id'] },
		annotations: { readOnlyHint: true },
		async run(args, user) {
			const g = await groupFor(args.group_id, user);
			const [state, categories] = await Promise.all([loadGroupState(g.group.id), loadCategories(g.group.id)]);
			const cur = g.group.baseCurrency;
			const kasseName = (id: string) => state.kassen.find((k) => k.id === id)?.name ?? '?';
			return {
				group: { id: g.group.id, name: g.group.name, currency: cur, status: g.group.status, closed_until: g.group.closedUntil },
				me: user.name,
				members: state.members.map((m) => ({
					id: m.personId,
					name: m.name,
					factor: m.factor,
					kasse: m.kassePersonal ? null : m.kasseName,
					from: m.participationFrom,
					to: m.participationTo
				})),
				balances: [...state.balances.kassen.values()].map((k) => ({
					kasse: kasseName(k.kasseId),
					people: k.personIds.map((id) => state.members.find((m) => m.personId === id)?.name ?? '?'),
					paid: major(k.paid, cur),
					consumed: major(k.consumed, cur),
					balance: major(k.balance, cur),
					mine: k.kasseId === g.membership.kasseId
				})),
				suggested_transfers: state.transfers.map((t) => ({ from: kasseName(t.from), to: kasseName(t.to), amount: major(t.amount, cur) })),
				categories: categories.filter((c) => !c.hidden).map((c) => c.name),
				profiles: state.profiles.map((p) => p.name)
			};
		}
	},
	{
		name: 'list_expenses',
		title: 'Ausgaben auflisten',
		description: 'Ausgaben einer Gruppe, neueste zuerst. Optional nach Zeitraum oder Suchbegriff gefiltert.',
		inputSchema: {
			type: 'object',
			properties: {
				group_id: groupId,
				from_date: { type: 'string', description: 'ab Datum (YYYY-MM-DD)' },
				to_date: { type: 'string', description: 'bis Datum (YYYY-MM-DD)' },
				query: { type: 'string', description: 'Suchbegriff im Titel oder in den Notizen' },
				limit: { type: 'number', description: 'höchstens so viele (Standard 50, max. 200)' }
			},
			required: ['group_id']
		},
		annotations: { readOnlyHint: true },
		async run(args, user) {
			const g = await groupFor(args.group_id, user);
			const [expenses, state, categories] = await Promise.all([loadExpenses(g.group.id), loadGroupState(g.group.id), loadCategories(g.group.id)]);
			const name = (id: string) => state.members.find((m) => m.personId === id)?.name ?? '?';
			const q = norm(str(args.query));
			const limit = Math.min(200, Math.max(1, Number(args.limit) || 50));
			return expenses
				.filter((e) => (!str(args.from_date) || e.date >= str(args.from_date)) && (!str(args.to_date) || e.date <= str(args.to_date)))
				.filter((e) => !q || norm(`${e.title} ${e.notes ?? ''}`).includes(q))
				.slice(0, limit)
				.map((e) => ({
					id: e.id,
					date: e.date,
					title: e.title,
					type: e.type === 'income' ? 'Einnahme' : 'Ausgabe',
					amount: major(e.amount, e.currency),
					currency: e.currency,
					amount_in_group_currency: major(e.baseAmount, g.group.baseCurrency),
					paid_by: e.payers.map((p) => ({ name: name(p.personId), amount: major(p.amount, e.currency) })),
					category: categories.find((c) => c.id === e.categoryId)?.name ?? null,
					notes: e.notes
				}));
		}
	},
	{
		name: 'add_expense',
		title: 'Ausgabe eintragen',
		description:
			'Trägt eine Ausgabe ein. Ohne participants wird auf alle Mitglieder (nach ihren Faktoren) aufgeteilt, ohne paid_by hat der Nutzer selbst bezahlt.',
		inputSchema: {
			type: 'object',
			properties: {
				group_id: groupId,
				title: { type: 'string', description: 'z.B. "Abendessen Pizzeria"' },
				amount: { type: 'number', description: 'Betrag in Haupteinheiten, z.B. 42.5' },
				currency: { type: 'string', description: 'ISO-Code, Standard: Währung der Gruppe' },
				date: { type: 'string', description: 'YYYY-MM-DD, Standard: heute' },
				paid_by: { type: 'string', description: 'Name oder ID der Person, die bezahlt hat (Standard: der Nutzer)' },
				participants: { type: 'array', items: { type: 'string' }, description: 'Nur diese Personen teilen sich die Ausgabe (Namen oder IDs)' },
				equal_weights: { type: 'boolean', description: 'Alle gleich gewichten statt nach Faktoren' },
				category: { type: 'string', description: 'Name der Kategorie (siehe get_group)' },
				profile: { type: 'string', description: 'Name eines Ausgaben-Profils (siehe get_group); ersetzt participants' },
				notes: { type: 'string' }
			},
			required: ['group_id', 'title', 'amount']
		},
		annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
		async run(args, user) {
			const g = await groupFor(args.group_id, user);
			if (g.group.status === 'settled') throw new ToolError('Die Endabrechnung dieser Gruppe steht; es können keine Ausgaben mehr eingetragen werden.');
			const state = await loadGroupState(g.group.id);
			const currency = (str(args.currency) || g.group.baseCurrency).toUpperCase();
			const amount = toMinor(args.amount, currency);
			const payer = args.paid_by ? findMember(state.members, args.paid_by) : findMember(state.members, user.id);
			let rule: SplitRule = { type: 'all' };
			if (Array.isArray(args.participants) && args.participants.length) {
				rule = { type: 'only', included: [...new Set(args.participants.map((p) => findMember(state.members, p).personId))] };
			}
			let categoryId: string | null = null;
			if (str(args.category)) {
				const cats = (await loadCategories(g.group.id)).filter((c) => !c.hidden);
				const cat = cats.find((c) => c.id === str(args.category) || norm(c.name) === norm(str(args.category)));
				if (!cat) throw new ToolError(`Unbekannte Kategorie. Vorhanden: ${cats.map((c) => c.name).join(', ')}.`);
				categoryId = cat.id;
			}
			let profileId: string | null = null;
			if (str(args.profile)) {
				const profile = state.profiles.find((p) => p.id === str(args.profile) || norm(p.name) === norm(str(args.profile)));
				if (!profile) throw new ToolError(`Unbekanntes Profil. Vorhanden: ${state.profiles.map((p) => p.name).join(', ') || 'keine'}.`);
				profileId = profile.id;
			}
			const input: ExpenseInput = {
				type: 'expense',
				title: str(args.title),
				amount,
				currency,
				date: str(args.date) || today(),
				payers: [{ personId: payer.personId, amount }],
				categoryId,
				profileId,
				rule,
				privateAmount: 0,
				rate: { source: 'auto' },
				period: null,
				notes: str(args.notes),
				equalWeights: args.equal_weights === true
			};
			let prepared;
			try {
				prepared = await prepareExpense(input, g.group, state.members, state.profiles);
			} catch (e) {
				if (e instanceof InputError) throw new ToolError(e.message);
				throw e;
			}
			if (isClosed(g.group, prepared.row.date)) throw new ToolError(`Die Abrechnung ist bis ${g.group.closedUntil} abgeschlossen. Wähle ein späteres Datum.`);
			const id = await saveExpense(g.group.id, user.id, prepared);
			announceExpense(g.group, user, prepared.row, id);
			return {
				saved: true,
				id,
				title: prepared.row.title,
				amount: major(prepared.row.amount, currency),
				currency,
				amount_in_group_currency: major(prepared.row.baseAmount, g.group.baseCurrency),
				date: prepared.row.date,
				paid_by: payer.name,
				split_between:
					rule.type === 'only' ? rule.included.map((id) => state.members.find((m) => m.personId === id)?.name) : 'alle Mitglieder',
				link: `/gruppen/${g.group.id}/ausgaben/${id}`
			};
		}
	},
	{
		name: 'record_payment',
		title: 'Zahlung eintragen',
		description:
			'Trägt eine Zahlung zwischen zwei Personen bzw. Kassen der Gruppe ein (Ausgleich, Teilzahlung, Bargeld). Ohne from zahlt der Nutzer selbst. Der Empfänger muss den Eingang bestätigen, außer der Nutzer ist selbst Empfänger.',
		inputSchema: {
			type: 'object',
			properties: {
				group_id: groupId,
				to: { type: 'string', description: 'Empfänger: Name oder ID einer Person (es zählt ihre Kasse)' },
				amount: { type: 'number', description: 'Betrag in der Währung der Gruppe, Haupteinheiten' },
				from: { type: 'string', description: 'Zahler: Name oder ID einer Person (Standard: der Nutzer)' },
				method: { type: 'string', enum: [...paymentMethods], description: 'cash, transfer, paypal, wero oder other' },
				date: { type: 'string', description: 'YYYY-MM-DD, Standard: heute' }
			},
			required: ['group_id', 'to', 'amount']
		},
		annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
		async run(args, user) {
			const g = await groupFor(args.group_id, user);
			const state = await loadGroupState(g.group.id);
			const from = args.from ? findMember(state.members, args.from) : findMember(state.members, user.id);
			const to = findMember(state.members, args.to);
			if (from.kasseId === to.kasseId) throw new ToolError(`${from.name} und ${to.name} rechnen über dieselbe Kasse ab.`);
			const amount = toMinor(args.amount, g.group.baseCurrency);
			const date = str(args.date);
			if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today())) throw new ToolError('Ungültiges Datum.');
			try {
				const res = await recordSettlement(g, {
					from: from.kasseId,
					to: to.kasseId,
					amount,
					method: paymentMethods.find((m) => m === args.method) ?? 'other',
					date: date || undefined
				});
				return {
					saved: true,
					from: from.kassePersonal ? from.name : from.kasseName,
					to: to.kassePersonal ? to.name : to.kasseName,
					amount: major(amount, g.group.baseCurrency),
					status: res.confirmed ? 'bestätigt' : 'wartet auf Bestätigung durch den Empfänger'
				};
			} catch (e) {
				if (e instanceof SettlementError) throw new ToolError(e.message);
				throw e;
			}
		}
	}
];

interface JsonRpcRequest {
	jsonrpc: '2.0';
	id?: string | number | null;
	method: string;
	params?: Record<string, unknown>;
}

const rpcError = (id: JsonRpcRequest['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

async function callTool(params: Record<string, unknown> | undefined, user: SessionUser) {
	const tool = tools.find((t) => t.name === params?.name);
	if (!tool) return null;
	try {
		const result = await tool.run((params?.arguments as Args) ?? {}, user);
		return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
	} catch (e) {
		// errors the assistant can fix go back as tool errors, not protocol errors
		const message =
			e instanceof ToolError ? e.message : isHttpError(e) ? e.body.message : (console.error('MCP-Tool fehlgeschlagen:', e), 'Interner Fehler.');
		return { content: [{ type: 'text', text: message }], isError: true };
	}
}

/** Handles one JSON-RPC message; returns null for notifications (no answer). */
export async function handleMcpMessage(msg: JsonRpcRequest, user: SessionUser) {
	if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid Request');
	const isNotification = msg.id === undefined;
	if (isNotification) return null;
	switch (msg.method) {
		case 'initialize': {
			const requested = String(msg.params?.protocolVersion ?? '');
			return {
				jsonrpc: '2.0',
				id: msg.id,
				result: {
					protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
					capabilities: { tools: { listChanged: false } },
					serverInfo: { name: 'split', title: 'Split', version },
					instructions: INSTRUCTIONS
				}
			};
		}
		case 'ping':
			return { jsonrpc: '2.0', id: msg.id, result: {} };
		case 'tools/list':
			return {
				jsonrpc: '2.0',
				id: msg.id,
				result: { tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) }
			};
		case 'tools/call': {
			const result = await callTool(msg.params, user);
			return result ? { jsonrpc: '2.0', id: msg.id, result } : rpcError(msg.id, -32602, `Unknown tool: ${String(msg.params?.name)}`);
		}
		case 'resources/list':
			return { jsonrpc: '2.0', id: msg.id, result: { resources: [] } };
		case 'prompts/list':
			return { jsonrpc: '2.0', id: msg.id, result: { prompts: [] } };
		default:
			return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
	}
}

export const mcpToolNames = tools.map((t) => ({ name: t.name, title: t.title, description: t.description }));
