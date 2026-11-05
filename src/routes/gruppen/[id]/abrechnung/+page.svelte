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
	// cost columns: the categories in use, plus "ohne" for expenses without a category
	const costCols = $derived(
		[...data.categories, { id: '', icon: 'ohne', name: 'Ohne Kategorie' }].filter((cat) =>
			Object.values(data.costs.kassen).some((k) => (k[cat.id] ?? 0) !== 0)
		)
	);
	const sum = (t: Record<string, number>) => Object.values(t).reduce((s, v) => s + v, 0);
	const pending = $derived(
		data.members.filter((m) => data.completion.required.includes(m.personId) && !data.completion.done.includes(m.personId)).map((m) => m.name)
	);
</script>

<svelte:head>
	<title>{data.completion.final ? 'Endabrechnung' : 'Vorläufige Abrechnung'} {data.group.name}</title>
	<!-- many person columns: print in landscape -->
	{@html '<style>@page { size: A4 landscape; margin: 12mm; }</style>'}
</svelte:head>

<div class="noprint row" style="margin-bottom: 1rem">
	<a href="/gruppen/{data.group.id}/salden" class="small grow">← Zurück</a>
	<a class="button" href="/gruppen/{data.group.id}/export.csv" download>📊 CSV</a>
	<button class="primary" onclick={() => window.print()}>Drucken / als PDF speichern</button>
</div>

<article class="doc">
	<h1>{data.group.emoji} {data.completion.final ? 'Endabrechnung' : 'Vorläufige Abrechnung'} {data.group.name}</h1>
	<p class="muted small">
		{#if data.group.startDate}{formatDate(data.group.startDate)}{#if data.group.endDate}{' '}– {formatDate(data.group.endDate)}{/if} · {/if}
		{data.members.length} Personen ·
		{#if data.completion.final && data.completion.finalAt}
			steht seit {formatDate(data.completion.finalAt.slice(0, 10))}
		{:else}
			Stand {new Date(data.generatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
		{/if}
	</p>
	{#if !data.completion.final && pending.length}
		<p class="pending"><strong>Noch nicht abgeschlossen:</strong> {pending.join(', ')}. Bis alle fertig sind, kann sich die Abrechnung noch ändern.</p>
	{/if}

	<h2>Übersicht</h2>
	<table>
		<thead><tr><th>Kasse</th><th>Personen</th><th class="r">bezahlt</th><th class="r">Anteil</th><th class="r">Ausgleich</th><th class="r">Saldo</th></tr></thead>
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
					<tr><td>{formatDate(s.date)}</td><td>{kasseName(s.fromKasseId)} → {kasseName(s.toKasseId)}</td>{#if data.group.settings.confirmPayments}<td>{s.status === 'confirmed' ? 'bestätigt' : 'offen'}</td>{/if}<td class="r">{formatAmount(s.amount, c)}</td></tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<h2>Kosten nach Kategorie</h2>
	<table>
		<thead><tr><th>Kasse</th>{#each costCols as cat (cat.id)}<th class="r" title={cat.name}>{cat.icon}</th>{/each}<th class="r">Summe</th></tr></thead>
		<tbody>
			{#each Object.entries(data.costs.kassen) as [id, t] (id)}
				<tr>
					<td>{kasseName(id)}</td>
					{#each costCols as cat (cat.id)}<td class="r">{t[cat.id] ? formatAmount(t[cat.id], c) : ''}</td>{/each}
					<td class="r"><strong>{formatAmount(sum(t), c)}</strong></td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h2 class="pagebreak">Alle Ausgaben mit Anteilen pro Person</h2>
	<!-- the expense columns stay put, only the people scroll -->
	<div class="scroll">
		<table class="matrix">
			<thead>
				<tr>
					<th class="c1">Datum</th>
					<th class="c2">Wofür</th>
					<th class="c3">Bezahlt von</th>
					<th class="r c4">Betrag</th>
					{#each data.members as m (m.personId)}<th class="r person">{m.name}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each sorted as e (e.id)}
					{@const sh = data.shares[e.id] ?? {}}
					<tr>
						<td class="nowrap c1">{formatDate(e.date, { day: '2-digit', month: '2-digit' })}</td>
						<td class="c2">
							{e.categoryId ? cats.get(e.categoryId)?.icon : ''} {e.title}{#if e.type === 'income'}{' '}(Einnahme){/if}
							{#if e.privateAmount > 0}<div class="muted">davon privat {formatAmount(e.privateAmount, c)}</div>{/if}
						</td>
						<td class="c3">{e.payers.map((p) => people.get(p.personId) ?? '?').join(', ')}</td>
						<td class="r c4">
							{e.type === 'income' ? '−' : ''}{formatAmount(e.baseAmount, c)}
							{#if e.currency !== c}<div class="muted">{formatAmount(e.amount, e.currency)}</div>{/if}
						</td>
						{#each data.members as m (m.personId)}
							<td class="r" class:muted={!sh[m.personId]}>{sh[m.personId] ? formatAmount(sh[m.personId], c) : '–'}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="2" class="c1">Anteil gesamt</td>
					<td class="c3"></td>
					<td class="r c4">{formatAmount(total, c)}</td>
					{#each data.members as m (m.personId)}<td class="r">{formatAmount(data.balances.persons[m.personId]?.consumed ?? 0, c)}</td>{/each}
				</tr>
				<tr>
					<td colspan="2" class="c1">Bezahlt</td>
					<td class="c3"></td>
					<td class="c4"></td>
					{#each data.members as m (m.personId)}<td class="r">{formatAmount(data.balances.persons[m.personId]?.paid ?? 0, c)}</td>{/each}
				</tr>
				<tr class="saldo">
					<td colspan="2" class="c1">Saldo (bezahlt − Anteil, vor Ausgleich)</td>
					<td class="c3"></td>
					<td class="c4"></td>
					{#each data.members as m (m.personId)}
						{@const b = data.balances.persons[m.personId]?.balance ?? 0}
						<td class="r">{b > 0 ? '+' : ''}{formatAmount(b, c)}</td>
					{/each}
				</tr>
			</tfoot>
		</table>
	</div>
</article>

<style>
	/* theme colours, so it stays readable in dark mode (print: see below) */
	.pending {
		border-left: 3px solid #c58a1d;
		padding: 0.3rem 0.6rem;
		background: var(--warning-bg);
		color: var(--text);
	}
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
	.scroll {
		overflow-x: auto;
	}
	@media screen {
		/* on a laptop the statement uses the whole window instead of the narrow app column */
		.doc {
			width: min(1400px, calc(100vw - 2rem));
			position: relative;
			left: 50%;
			transform: translateX(-50%);
		}
		/* fixed widths so the left columns can stick while the people scroll */
		.matrix {
			--w1: 3.2rem;
			--w2: 7.5rem;
			--w3: 0rem;
			--w4: 0rem;
		}
		.matrix .c1,
		.matrix .c2 {
			position: sticky;
			background: var(--surface);
			z-index: 1;
		}
		.matrix .c1 {
			left: 0;
			min-width: var(--w1);
			max-width: var(--w1);
		}
		.matrix .c2 {
			left: var(--w1);
			min-width: var(--w2);
			max-width: var(--w2);
			box-shadow: 1px 0 0 var(--border);
		}
		/* footer labels span the expense columns */
		.matrix tfoot td.c1 {
			min-width: calc(var(--w1) + var(--w2));
			max-width: calc(var(--w1) + var(--w2));
			box-shadow: 1px 0 0 var(--border);
		}
	}
	@media screen and (min-width: 800px) {
		.matrix {
			--w2: 14rem;
			--w3: 8rem;
			--w4: 6.5rem;
		}
		.matrix .c3,
		.matrix .c4 {
			position: sticky;
			background: var(--surface);
			z-index: 1;
		}
		.matrix .c2,
		.matrix tfoot td.c1 {
			box-shadow: none;
		}
		.matrix .c3 {
			left: calc(var(--w1) + var(--w2));
			min-width: var(--w3);
			max-width: var(--w3);
		}
		.matrix .c4 {
			left: calc(var(--w1) + var(--w2) + var(--w3));
			min-width: var(--w4);
			max-width: var(--w4);
			box-shadow: 1px 0 0 var(--border);
		}
	}
	.matrix {
		font-size: 0.8rem;
	}
	.matrix th.person {
		max-width: 6rem;
		overflow-wrap: anywhere;
	}
	.matrix td .muted {
		font-size: 0.75rem;
	}
	.matrix tfoot td {
		font-weight: 600;
		border-top: 2px solid var(--border);
	}
	.matrix .saldo td {
		border-top: 1px solid var(--border);
	}
	.nowrap {
		white-space: nowrap;
	}
	@media print {
		.scroll {
			overflow: visible;
		}
		.matrix {
			font-size: 8pt;
		}
		.pagebreak {
			break-before: page;
		}
		tr {
			break-inside: avoid;
		}
		thead {
			display: table-header-group;
		}
		:global(header),
		.noprint {
			display: none !important;
		}
		.pending {
			background: #fdf5e4 !important;
			color: #000 !important;
		}
		:global(html),
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
