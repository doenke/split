<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatDate } from '$lib/format';

	let { data, form } = $props();
	let query = $state('');
	let showInactive = $state(true);
	const filtered = $derived(
		data.persons.filter(
			(p) =>
				(showInactive || !p.deactivatedAt) &&
				(!query.trim() || `${p.name} ${p.email ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
		)
	);
	const inactive = $derived(data.persons.filter((p) => p.deactivatedAt).length);
</script>

<svelte:head><title>Personen · Split</title></svelte:head>

<a href="/profil" class="small">← Profil</a>
<h1>Personen</h1>
<p class="muted small">
	Deaktivierte Personen werden nirgends mehr als „bekannte Person“ angeboten. In ihren Gruppen und Kassen bleiben sie
	mit allen Ausgaben und Salden erhalten.
</p>

{#if form && 'message' in form && form.message}<p class="error">{form.message}</p>{/if}

<div class="row" style="margin-bottom: 0.75rem">
	<input type="search" bind:value={query} placeholder="Suchen …" class="grow" style="width: auto" aria-label="Personen suchen" />
	<label class="check small"><input type="checkbox" bind:checked={showInactive} /> Deaktivierte ({inactive})</label>
</div>

<div class="list">
	{#each filtered as p (p.id)}
		<div class:inactive={p.deactivatedAt}>
			<Avatar name={p.name} color={p.color} url={p.avatarUrl} size={34} />
			<div class="grow">
				<div class="ellipsis">
					<strong>{p.name}</strong>{#if p.id === data.user?.id} <span class="badge">du</span>{/if}{#if p.isAdmin} <span class="badge">Admin</span>{/if}
				</div>
				<div class="small muted ellipsis">
					{p.access} · {p.groups} {p.groups === 1 ? 'Gruppe' : 'Gruppen'}{#if p.email} · {p.email}{/if}
					{#if p.deactivatedAt} · deaktiviert seit {formatDate(p.deactivatedAt.slice(0, 10))}{/if}
				</div>
			</div>
			{#if p.id !== data.user?.id}
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={p.id} />
					<input type="hidden" name="deactivate" value={p.deactivatedAt ? '0' : '1'} />
					<button class="small-btn" class:primary={!!p.deactivatedAt}>{p.deactivatedAt ? 'Aktivieren' : 'Deaktivieren'}</button>
				</form>
			{/if}
		</div>
	{:else}
		<div class="muted">Keine Personen gefunden.</div>
	{/each}
</div>

<style>
	.inactive {
		opacity: 0.55;
	}
	.small-btn {
		min-height: 36px;
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
	}
</style>
