<script lang="ts">
	import { formatAmount } from '$lib/format';

	let { data } = $props();
</script>

<svelte:head><title>Meine Gruppen · Split</title></svelte:head>

<div class="row" style="justify-content: space-between; margin-bottom: 1rem">
	<h1 style="margin: 0">Meine Gruppen</h1>
	{#if data.user?.isOidc}
		<a class="button primary" href="/gruppen/neu">+ Neue Gruppe</a>
	{/if}
</div>

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
	<div class="list">
		{#each data.groups as g (g.id)}
			<a href="/gruppen/{g.id}">
				<span class="emoji">{g.emoji}</span>
				<div class="grow">
					<div class="ellipsis"><strong>{g.name}</strong></div>
					<div class="small muted">
						{g.memberCount} Personen{#if g.drafts}{' · 📷 '}{g.drafts} vorbereitet{/if}{#if g.status === 'archived'} · archiviert{/if}
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
{/if}

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
	.emoji {
		font-size: 1.8rem;
		width: 2.4rem;
		text-align: center;
	}
</style>
