<script lang="ts">
	import { formatAmount } from '$lib/core/currency';

	let {
		totals,
		categories,
		currency
	}: {
		totals: Record<string, number>;
		categories: { id: string; name: string; icon: string; color: string }[];
		currency: string;
	} = $props();

	const cats = $derived(new Map(categories.map((c) => [c.id, c])));
	const rows = $derived(
		Object.entries(totals)
			.filter(([, v]) => v > 0)
			.sort((a, b) => b[1] - a[1])
			.map(([id, v]) => ({ id, v, cat: cats.get(id) }))
	);
	const sum = $derived(rows.reduce((s, r) => s + r.v, 0));
</script>

<div class="stack-bar" aria-hidden="true">
	{#each rows as r (r.id)}
		<span style:width="{(r.v / sum) * 100}%" style:background={r.cat?.color ?? '#999'}></span>
	{/each}
</div>
<div class="rows">
	{#each rows as r (r.id)}
		<div class="row-c">
			<span class="dot" style:background={r.cat?.color ?? '#999'}></span>
			<span class="grow">{r.cat ? `${r.cat.icon} ${r.cat.name}` : 'Ohne Kategorie'}</span>
			<span class="muted small">{Math.round((r.v / sum) * 100)} %</span>
			<span class="amount">{formatAmount(r.v, currency)}</span>
		</div>
	{/each}
</div>

<style>
	.stack-bar {
		display: flex;
		height: 10px;
		border-radius: 5px;
		overflow: hidden;
		background: var(--surface-2);
		margin: 0.5rem 0 0.6rem;
	}
	.stack-bar span {
		display: block;
		height: 100%;
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.row-c {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.amount {
		min-width: 5.5rem;
		text-align: right;
	}
</style>
