<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import CostBars from '$lib/components/CostBars.svelte';
	import { formatAmount } from '$lib/format';

	let { data } = $props();
	const currency = $derived(data.group.baseCurrency);
	const sum = (t: Record<string, number>) => Object.values(t).reduce((s, v) => s + v, 0);
	const groupTotals = $derived.by(() => {
		const t: Record<string, number> = {};
		for (const k of Object.values(data.costs.kassen)) for (const [c, v] of Object.entries(k)) t[c] = (t[c] ?? 0) + v;
		return t;
	});
	const kassen = $derived(
		Object.entries(data.costs.kassen)
			.map(([id, t]) => ({ id, totals: t, sum: sum(t), members: data.members.filter((m) => m.kasseId === id) }))
			.sort((a, b) => (a.id === data.myKasseId ? -1 : b.id === data.myKasseId ? 1 : b.sum - a.sum))
	);
	let open = $state<string | null>(null);
</script>

<svelte:head><title>Kosten · {data.group.name}</title></svelte:head>

<a href="/gruppen/{data.group.id}/salden" class="small">← Salden</a>
<h2 style="margin-top: 0.75rem">Was hat es gekostet?</h2>
<p class="small muted">Der tatsächlich verbrauchte Anteil – unabhängig davon, wer bezahlt hat.</p>

<div class="card">
	<div class="row" style="justify-content: space-between">
		<strong>Ganze Gruppe</strong>
		<span class="amount">{formatAmount(sum(groupTotals), currency)}</span>
	</div>
	<CostBars totals={groupTotals} categories={data.categories} {currency} />
</div>

{#each kassen as k (k.id)}
	<div class="card">
		<div class="row" style="justify-content: space-between">
			<div class="row" style="gap: 0.5rem">
				{#each k.members.slice(0, 3) as m (m.personId)}<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={26} />{/each}
				<strong>{data.kassen[k.id]?.name ?? '?'}</strong>
				{#if k.id === data.myKasseId}<span class="badge">ihr</span>{/if}
			</div>
			<span class="amount">{formatAmount(k.sum, currency)}</span>
		</div>
		<CostBars totals={k.totals} categories={data.categories} {currency} />
		{#if k.members.length > 1}
			<button class="link small" style="margin-top: 0.5rem" onclick={() => (open = open === k.id ? null : k.id)}>
				{open === k.id ? 'Weniger' : 'Pro Person anzeigen'}
			</button>
			{#if open === k.id}
				{#each k.members as m (m.personId)}
					{@const t = data.costs.persons[m.personId] ?? {}}
					<div class="person">
						<div class="row" style="justify-content: space-between">
							<span>{m.name}</span><span class="amount">{formatAmount(sum(t), currency)}</span>
						</div>
						<CostBars totals={t} categories={data.categories} {currency} />
					</div>
				{/each}
			{/if}
		{/if}
	</div>
{/each}

<style>
	.person {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--border);
	}
</style>
