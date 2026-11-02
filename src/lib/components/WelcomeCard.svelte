<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PasskeySetup from './PasskeySetup.svelte';
	import BookmarkLink from './BookmarkLink.svelte';
	import AppAddress from './AppAddress.svelte';

	/** Shown once right after joining via an invitation: no account needed, keep the link or add a passkey. */
	let { name, hasPasskey }: { name: string; hasPasskey: boolean } = $props();

	// the personal link the person came with (remembered by the invitation page, never put into the URL)
	let link = $state<string | null>(null);
	// svelte-ignore state_referenced_locally
	let passkeyDone = $state(hasPasskey);
	onMount(() => {
		try {
			link = sessionStorage.getItem('split-link');
		} catch {
			// storage blocked: no link to show
		}
	});

	function close() {
		try {
			sessionStorage.removeItem('split-link');
		} catch {
			// nothing to clean up
		}
		const url = new URL(page.url);
		url.searchParams.delete('willkommen');
		goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
	}
</script>

<div class="card welcome">
	<div class="row" style="justify-content: space-between; align-items: flex-start">
		<h2 style="margin: 0">Willkommen, {name}! 🎉</h2>
		<button type="button" class="link small" onclick={close} aria-label="Schließen">✕</button>
	</div>
	<p class="small">Du bist dabei – ein Konto brauchst du nicht.</p>
	{#if link}
		<p class="small" style="margin-bottom: 0">Mit deinem persönlichen Link kommst du jederzeit wieder rein, auch auf einem anderen Gerät:</p>
		<BookmarkLink url={link} />
	{/if}
	{#if !passkeyDone}
		<p class="small">
			Bequemer geht es mit einem <strong>Passkey</strong> (Face ID, Fingerabdruck oder Geräte-PIN) – dann meldest du dich
			einfach unter <AppAddress /> an{link ? ' und brauchst den Link nicht mehr' : ''}.
		</p>
		<PasskeySetup ondone={() => (passkeyDone = true)} />
	{:else if !hasPasskey}
		<p class="small positive">✔ Passkey gespeichert.</p>
	{/if}
	<button class="full" style="margin-top: 0.6rem" onclick={close}>Los geht's</button>
</div>

<style>
	.welcome {
		border: 2px solid var(--primary);
	}
</style>
