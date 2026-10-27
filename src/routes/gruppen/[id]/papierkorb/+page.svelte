<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatAmount } from '$lib/format';

	let { data } = $props();
	const daysLeft = (d: Date) => Math.max(0, data.trashDays - Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000));
	const kasseName = (id: string) => data.kassen[id]?.name ?? '?';
</script>

<svelte:head><title>Papierkorb · {data.group.name}</title></svelte:head>

<a href="/gruppen/{data.group.id}/einstellungen" class="small">← Einstellungen</a>
<h2 style="margin-top: 0.75rem">Papierkorb</h2>
<p class="small muted">Gelöschtes bleibt {data.trashDays} Tage hier und kann wiederhergestellt werden.</p>

{#if data.trashExpenses.length === 0 && data.trashSettlements.length === 0}
	<div class="card muted">Der Papierkorb ist leer.</div>
{/if}

{#if data.trashExpenses.length}
	<h3>Ausgaben</h3>
	<div class="list">
		{#each data.trashExpenses as e (e.id)}
			<div>
				<div class="grow">
					<strong>{e.title}</strong>
					<div class="small muted">{formatAmount(e.amount, e.currency)} · noch {daysLeft(e.deletedAt!)} Tage</div>
				</div>
				<form method="POST" action="?/restoreExpense" use:enhance>
					<input type="hidden" name="id" value={e.id} />
					<button>Wiederherstellen</button>
				</form>
			</div>
		{/each}
	</div>
{/if}

{#if data.trashSettlements.length}
	<h3>Zahlungen</h3>
	<div class="list">
		{#each data.trashSettlements as s (s.id)}
			<div>
				<div class="grow">
					<strong>{kasseName(s.fromKasseId)} → {kasseName(s.toKasseId)}</strong>
					<div class="small muted">{formatAmount(s.amount, data.group.baseCurrency)} · noch {daysLeft(s.deletedAt!)} Tage</div>
				</div>
				<form method="POST" action="?/restoreSettlement" use:enhance>
					<input type="hidden" name="id" value={s.id} />
					<button>Wiederherstellen</button>
				</form>
			</div>
		{/each}
	</div>
{/if}
