<script lang="ts">
	import { formatAmount, formatDate } from '$lib/format';

	let { data } = $props();
	const c = $derived(data.group.baseCurrency);
	const people = $derived(new Map(data.members.map((m) => [m.personId, m.name])));
	const cats = $derived(new Map(data.categories.map((x) => [x.id, x])));
	const kasseName = (id: string) => data.kassen[id]?.name ?? '?';
	const kassen = $derived(Object.values(data.balances.kassen).sort((a, b) => b.balance - a.balance));
	const total = $derived(data.expenses.reduce((s, e) => s + (e.type === 'income' ? -1 : 1) * (e.baseAmount - e.privateAmount), 0));
	const sorted = $derived(data.expenses.slice().sort((a, b) => a.date.localeCompare(b.date)));
	const sum = (t: Record<string, number>) => Object.values(t).reduce((s, v) => s + v, 0);
</script>

<svelte:head><title>Abrechnung {data.group.name}</title></svelte:head>

<div class="noprint row" style="margin-bottom: 1rem">
	<a href="/gruppen/{data.group.id}/einstellungen" class="small grow">← Zurück</a>
	<button class="primary" onclick={() => window.print()}>Drucken / als PDF speichern</button>
</div>

<article class="doc">
	<h1>{data.group.emoji} Abrechnung {data.group.name}</h1>
	<p class="muted small">
		{#if data.group.startDate}{formatDate(data.group.startDate)}{#if data.group.endDate} – {formatDate(data.group.endDate)}{/if} · {/if}
		{data.members.length} Personen · Stand {new Date(data.generatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
		{#if data.group.closedUntil} · abgeschlossen bis {formatDate(data.group.closedUntil)}{/if}
	</p>

	<h2>Übersicht</h2>
	<table>
		<thead><tr><th>Kasse</th><th>Personen</th><th class="r">bezahlt</th><th class="r">verbraucht</th><th class="r">Ausgleich</th><th class="r">Saldo</th></tr></thead>
		<tbody>
			{#each kassen as k (k.kasseId)}
				<tr>
					<td>{kasseName(k.kasseId)}</td>
					<td class="small">{k.personIds.map((id) => people.get(id) ?? '?').join(', ')}</td>
					<td class="r">{formatAmount(k.paid, c)}</td>
					<td class="r">{formatAmount(k.consumed, c)}</td>
					<td class="r">{formatAmount(k.settlementsSent - k.settlementsReceived, c)}</td>
					<td class="r"><strong>{formatAmount(k.balance, c)}</strong></td>
				</tr>
			{/each}
		</tbody>
		<tfoot><tr><td colspan="3">Gesamtausgaben</td><td class="r"><strong>{formatAmount(total, c)}</strong></td><td colspan="2"></td></tr></tfoot>
	</table>

	<h2>Offene Zahlungen</h2>
	{#if data.transfers.length}
		<table>
			<tbody>
				{#each data.transfers as t (t.from + t.to)}
					<tr><td>{kasseName(t.from)} → {kasseName(t.to)}</td><td class="r"><strong>{formatAmount(t.amount, c)}</strong></td></tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p>Alles ausgeglichen.</p>
	{/if}

	{#if data.settlements.length}
		<h2>Geleistete Zahlungen</h2>
		<table>
			<tbody>
				{#each data.settlements as s (s.id)}
					<tr><td>{formatDate(s.date)}</td><td>{kasseName(s.fromKasseId)} → {kasseName(s.toKasseId)}</td><td>{s.status === 'confirmed' ? 'bestätigt' : 'offen'}</td><td class="r">{formatAmount(s.amount, c)}</td></tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<h2>Kosten nach Kategorie</h2>
	<table>
		<thead><tr><th>Kasse</th>{#each data.categories.filter((cat) => Object.values(data.costs.kassen).some((k) => (k[cat.id] ?? 0) !== 0)) as cat (cat.id)}<th class="r">{cat.icon}</th>{/each}<th class="r">Summe</th></tr></thead>
		<tbody>
			{#each Object.entries(data.costs.kassen) as [id, t] (id)}
				<tr>
					<td>{kasseName(id)}</td>
					{#each data.categories.filter((cat) => Object.values(data.costs.kassen).some((k) => (k[cat.id] ?? 0) !== 0)) as cat (cat.id)}<td class="r">{t[cat.id] ? formatAmount(t[cat.id], c) : ''}</td>{/each}
					<td class="r"><strong>{formatAmount(sum(t), c)}</strong></td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h2>Alle Ausgaben</h2>
	<table class="small">
		<thead><tr><th>Datum</th><th>Wofür</th><th>Bezahlt von</th><th class="r">Betrag</th></tr></thead>
		<tbody>
			{#each sorted as e (e.id)}
				<tr>
					<td>{formatDate(e.date, { day: '2-digit', month: '2-digit' })}</td>
					<td>{e.categoryId ? cats.get(e.categoryId)?.icon : ''} {e.title}{#if e.type === 'income'} (Einnahme){/if}</td>
					<td>{e.payers.map((p) => people.get(p.personId) ?? '?').join(', ')}</td>
					<td class="r">
						{e.type === 'income' ? '−' : ''}{formatAmount(e.amount, e.currency)}
						{#if e.currency !== c}<br /><span class="muted">≈ {formatAmount(e.baseAmount, c)}</span>{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</article>

<style>
	.doc {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.25rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.35rem 0.4rem;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	th {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.r {
		text-align: right;
		white-space: nowrap;
	}
	h2 {
		margin-top: 1.25rem;
	}
	@media print {
		:global(header),
		.noprint {
			display: none !important;
		}
		:global(body),
		.doc {
			background: #fff !important;
			color: #000 !important;
			border: 0;
			padding: 0;
		}
		:global(main.container) {
			max-width: none;
			padding: 0;
		}
	}
</style>
