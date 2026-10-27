<script lang="ts">
	import { formatAmount, formatDate } from '$lib/format';
	import CompletionCard from '$lib/components/CompletionCard.svelte';
	import { onMount } from 'svelte';
	import { preloadData } from '$app/navigation';
	import { discardPending, flushPending, pendingExpenses, type PendingExpense } from '$lib/offline';

	let { data } = $props();
	const base = $derived(`/gruppen/${data.group.id}`);
	const currency = $derived(data.group.baseCurrency);
	const people = $derived(new Map(data.members.map((m) => [m.personId, m])));
	const cats = $derived(new Map(data.categories.map((c) => [c.id, c])));
	const myKasse = $derived(data.balances.kassen[data.myKasseId]);
	const total = $derived(
		data.expenses.reduce((s, e) => s + (e.type === 'income' ? -1 : 1) * (e.baseAmount - e.privateAmount), 0)
	);

	let pending = $state<PendingExpense[]>([]);
	const loadPending = async () => (pending = await pendingExpenses(data.group.id));
	onMount(() => {
		loadPending();
		// keep the form available offline
		if (navigator.onLine) preloadData(`/gruppen/${data.group.id}/ausgaben/neu`).catch(() => {});
		window.addEventListener('split:pending', loadPending);
		return () => window.removeEventListener('split:pending', loadPending);
	});

	let query = $state('');
	const filtered = $derived(
		query
			? data.expenses.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
			: data.expenses
	);
	const byDate = $derived.by(() => {
		const groups = new Map<string, typeof filtered>();
		for (const e of filtered) {
			if (!groups.has(e.date)) groups.set(e.date, []);
			groups.get(e.date)!.push(e);
		}
		return [...groups];
	});

	function payerText(e: (typeof data.expenses)[number]) {
		if (e.payers.length === 1) return people.get(e.payers[0].personId)?.name ?? '?';
		return `${e.payers.length} Personen`;
	}
</script>

<svelte:head><title>{data.group.name} · Split</title></svelte:head>

<div class="summary card">
	<div>
		<div class="small muted">Gesamtausgaben</div>
		<div class="amount big">{formatAmount(total, currency)}</div>
	</div>
	<a href="{base}/salden" class="right mine">
		<div class="small muted">{myKasse && myKasse.personIds.length > 1 ? 'Eure Kasse' : 'Dein Saldo'}</div>
		{#if !myKasse || myKasse.balance === 0}
			<div class="amount big">ausgeglichen</div>
		{:else}
			<div class="amount big {myKasse.balance > 0 ? 'positive' : 'negative'}">
				{myKasse.balance > 0 ? '+' : ''}{formatAmount(myKasse.balance, currency)}
			</div>
		{/if}
	</a>
</div>

{#if data.expenses.length || data.completion.final}
	<CompletionCard
		completion={data.completion}
		members={data.members}
		meId={data.user!.id}
		myKasseId={data.myKasseId}
		kasseName={data.kassen[data.myKasseId]?.name ?? ''}
		groupId={data.group.id}
		isAdmin={data.isAdmin}
	/>
{/if}

{#if pending.length}
	<div class="list pending">
		{#each pending as p (p.clientId)}
			<div>
				<span class="cat" style:background="#999">⏳</span>
				<div class="grow">
					<div class="ellipsis"><strong>{p.payload.title}</strong></div>
					<div class="small {p.error ? 'error' : 'muted'}">{p.error ?? 'Noch nicht übertragen – wartet auf Verbindung'}</div>
				</div>
				<div class="right">
					<div class="amount">{formatAmount(p.payload.amount, p.payload.currency)}</div>
					{#if p.error}
						<button class="link small danger" onclick={() => confirm('Verwerfen?') && discardPending(p.clientId)}>Verwerfen</button>
					{:else}
						<button class="link small" onclick={() => flushPending()}>Jetzt senden</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if data.expenses.length > 8}
	<input type="search" placeholder="Ausgaben durchsuchen …" bind:value={query} class="search" />
{/if}

{#if data.expenses.length === 0 && pending.length === 0}
	<div class="card">
		<p>Noch keine Ausgaben.</p>
		<p class="muted small">Tippe auf <strong>+</strong>, um die erste Ausgabe einzutragen.</p>
	</div>
{/if}

{#each byDate as [date, list] (date)}
	<div class="date small muted">{formatDate(date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
	<div class="list">
		{#each list as e (e.id)}
			{@const cat = e.categoryId ? cats.get(e.categoryId) : undefined}
			<a href="{base}/ausgaben/{e.id}">
				<span class="cat" style:background={cat?.color ?? '#999'}>{cat?.icon ?? '💶'}</span>
				<div class="grow">
					<div class="ellipsis"><strong>{e.title}</strong></div>
					<div class="small muted ellipsis">
						{e.type === 'income' ? 'erhalten von' : 'bezahlt von'}
						{payerText(e)}
						{#if e.privateAmount > 0}· {formatAmount(e.privateAmount, currency)} privat{/if}
						{#if e.attachments.length}· 📎{/if}
					</div>
				</div>
				<div class="right">
					<div class="amount" class:positive={e.type === 'income'}>
						{e.type === 'income' ? '−' : ''}{formatAmount(e.amount, e.currency)}
					</div>
					{#if e.currency !== currency}
						<div class="small muted">≈ {formatAmount(e.baseAmount, currency)}</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/each}

{#if data.group.status === 'active'}
	<a class="button primary fab" href="{base}/ausgaben/neu" aria-label="Neue Ausgabe">+</a>
{/if}

<style>
	.summary {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.mine {
		color: inherit;
		text-decoration: none;
	}
	.big {
		font-size: 1.35rem;
	}
	.pending {
		border-style: dashed;
	}
	.search {
		margin-bottom: 1rem;
	}
	.date {
		margin: 0.5rem 0.25rem 0.35rem;
		font-weight: 600;
	}
	.cat {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		flex-shrink: 0;
	}
</style>
