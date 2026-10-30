<script lang="ts">
	import { formatAmount } from '$lib/format';
	import InstallButton from '$lib/components/InstallButton.svelte';

	let { data } = $props();

	// groups by status: running ones first, archived ones folded away
	const sections = [
		{ status: 'active', title: 'Laufend' },
		{ status: 'settled', title: 'Abgerechnet' },
		{ status: 'archived', title: 'Archiviert' }
	] as const;
	const byStatus = $derived(
		Object.fromEntries(sections.map(({ status }) => [status, data.groups.filter((g) => g.status === status)]))
	);
</script>

<svelte:head><title>Meine Gruppen · Split</title></svelte:head>

<div class="row" style="justify-content: space-between; margin-bottom: 1rem">
	<h1 style="margin: 0">Meine Gruppen</h1>
	{#if data.user?.isOidc}
		<a class="button primary" href="/gruppen/neu">+ Neue Gruppe</a>
	{/if}
</div>

<InstallButton banner />

{#if data.groups.length === 0}
	<div class="card">
		<p>Du bist noch in keiner Gruppe.</p>
		{#if data.user?.isOidc}
			<p class="muted">Lege eine neue Gruppe an, z.B. für deine nächste Reise.</p>
		{:else}
			<p class="muted">Sobald dich jemand zu einer Gruppe hinzufügt, erscheint sie hier.</p>
		{/if}
	</div>
{:else}
	{#each sections as sec (sec.status)}
		{@const list = byStatus[sec.status]}
		{#if list.length}
			{#if sec.status === 'archived'}
				<details class="archived">
					<summary><h2 class="section">{sec.title} ({list.length})</h2></summary>
					{@render groupList(list)}
				</details>
			{:else}
				<h2 class="section">{sec.title} ({list.length})</h2>
				{@render groupList(list)}
			{/if}
		{/if}
	{/each}
{/if}

{#snippet groupList(list: typeof data.groups)}
	<div class="list">
		{#each list as g (g.id)}
			<a href="/gruppen/{g.id}">
				<span class="emoji">{g.emoji}</span>
				<div class="grow">
					<div class="ellipsis"><strong>{g.name}</strong></div>
					<div class="small muted">
						{g.memberCount} Personen{#if g.drafts}{' · 📷 '}{g.drafts} vorbereitet{/if}
					</div>
				</div>
				<div class="right">
					{#if g.myBalance === 0}
						<span class="small muted">ausgeglichen</span>
					{:else}
						<div class="amount {g.myBalance > 0 ? 'positive' : 'negative'}">
							{formatAmount(g.myBalance, g.currency)}
						</div>
						<div class="small muted">{g.myBalance > 0 ? 'bekommst du' : 'schuldest du'}</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/snippet}

{#if data.deleted.length}
	<details class="card small">
		<summary class="muted">🗑️ Gelöschte Gruppen ({data.deleted.length})</summary>
		{#each data.deleted as g (g.id)}
			<form method="POST" action="?/restoreGroup" class="row" style="margin-top: 0.5rem">
				<input type="hidden" name="id" value={g.id} />
				<span class="grow">{g.emoji} {g.name}</span>
				<button>Wiederherstellen</button>
			</form>
		{/each}
		<p class="hint">Gelöschte Gruppen werden nach 30 Tagen endgültig entfernt.</p>
	</details>
{/if}

<style>
	.section {
		margin: 0.5rem 0.25rem;
		font-size: 1rem;
	}
	.archived summary {
		cursor: pointer;
		list-style: none;
	}
	.archived summary::-webkit-details-marker {
		display: none;
	}
	.archived summary h2::before {
		content: '▸ ';
	}
	.archived[open] summary h2::before {
		content: '▾ ';
	}
	.emoji {
		font-size: 1.8rem;
		width: 2.4rem;
		text-align: center;
	}
</style>
