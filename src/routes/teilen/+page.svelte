<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let file = $state<File | null>(null);
	let preview = $state<string | null>(null);
	let busy = $state(false);
	let message = $state<string | null>(null);

	onMount(async () => {
		if (!('caches' in window)) return;
		const res = await (await caches.open('split-share')).match('/shared-file');
		if (!res) return;
		const blob = await res.blob();
		const name = decodeURIComponent(res.headers.get('x-file-name') ?? 'beleg');
		file = new File([blob], name, { type: blob.type });
		if (blob.type.startsWith('image/')) preview = URL.createObjectURL(blob);
	});

	function pick(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!f) return;
		file = f;
		preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
	}

	async function useIn(groupId: string) {
		if (!file) return;
		busy = true;
		message = null;
		try {
			const body = new FormData();
			body.append('file', file);
			const res = await fetch(`/gruppen/${groupId}/belege`, { method: 'POST', body });
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			await (await caches.open('split-share')).delete('/shared-file');
			await goto(`/gruppen/${groupId}/ausgaben/neu?beleg=${json.id}`);
		} catch (e) {
			message = (e as Error).message;
			busy = false;
		}
	}
</script>

<svelte:head><title>Beleg hinzufügen · Split</title></svelte:head>

<h1>Beleg hinzufügen</h1>

{#if file}
	<div class="card center">
		{#if preview}<img src={preview} alt="Beleg" class="preview" />{:else}<p>📄 {file.name}</p>{/if}
	</div>
	<h2>Für welche Gruppe?</h2>
	{#if message}<p class="error">{message}</p>{/if}
	<div class="list">
		{#each data.groups as g (g.id)}
			<button class="group" disabled={busy} onclick={() => useIn(g.id)}>
				<span class="emoji">{g.emoji}</span><span class="grow">{g.name}</span><span>→</span>
			</button>
		{:else}
			<div class="muted">Du bist in keiner aktiven Gruppe.</div>
		{/each}
	</div>
{:else}
	<div class="card">
		<p>Fotografiere einen Kassenbon oder wähle ein Foto bzw. PDF aus.</p>
		<label class="button primary full">
			📷 Beleg auswählen
			<input type="file" accept="image/*,application/pdf" onchange={pick} hidden />
		</label>
		<p class="hint">Tipp: Wenn Split installiert ist, kannst du Fotos auch direkt aus der Galerie „an Split teilen“.</p>
	</div>
{/if}

<style>
	.center {
		text-align: center;
	}
	.preview {
		max-width: 100%;
		max-height: 50vh;
		border-radius: 10px;
	}
	.group {
		width: 100%;
		border: 0;
		border-radius: 0;
		justify-content: flex-start;
		background: transparent;
		font-weight: 500;
	}
	.emoji {
		font-size: 1.5rem;
	}
</style>
