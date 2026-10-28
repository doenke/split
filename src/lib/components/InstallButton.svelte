<script lang="ts">
	import { onMount } from 'svelte';

	interface InstallPrompt extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}
	type W = Window & { __installPrompt?: InstallPrompt | null };

	/** banner: dismissible card on the start page; otherwise always shown (profile) */
	let { banner = false }: { banner?: boolean } = $props();

	const DISMISS_KEY = 'split-install-dismissed';
	let installed = $state(false);
	let prompt = $state<InstallPrompt | null>(null);
	let ios = $state(false);
	let dismissed = $state(false);
	let help = $state(false);
	let ready = $state(false);

	onMount(() => {
		installed =
			matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
		ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		try {
			dismissed = localStorage.getItem(DISMISS_KEY) === '1';
		} catch {
			// storage blocked: just show it
		}
		const update = () => (prompt = (window as W).__installPrompt ?? null);
		update();
		ready = true;
		addEventListener('split:installable', update);
		const onInstalled = () => (installed = true);
		addEventListener('appinstalled', onInstalled);
		return () => {
			removeEventListener('split:installable', update);
			removeEventListener('appinstalled', onInstalled);
		};
	});

	async function install() {
		if (!prompt) {
			help = !help;
			return;
		}
		await prompt.prompt();
		const { outcome } = await prompt.userChoice;
		(window as W).__installPrompt = null;
		prompt = null;
		if (outcome === 'accepted') installed = true;
	}

	function dismiss() {
		dismissed = true;
		try {
			localStorage.setItem(DISMISS_KEY, '1');
		} catch {
			// not remembered, fine
		}
	}

	// the banner only appears where installing is actually possible from here
	const show = $derived(ready && !installed && (!banner || (!dismissed && (prompt !== null || ios))));
</script>

{#if ready && installed && !banner}
	<p class="small muted">✅ Split läuft als App auf diesem Gerät.</p>
{:else if show}
	<div class:card={banner} class="install">
		<div class="row">
			<button type="button" class="primary" onclick={install}>📲 Als App installieren</button>
			{#if banner}<button type="button" class="link small" onclick={dismiss}>Nicht jetzt</button>{/if}
		</div>
		{#if banner}
			<p class="small muted">Startet wie eine App vom Homescreen – mit Benachrichtigungen und auch offline.</p>
		{/if}
		{#if help}
			{#if ios}
				<ol class="small">
					<li>In Safari unten auf <strong>Teilen</strong> <span aria-hidden="true">(□↑)</span> tippen</li>
					<li><strong>„Zum Home-Bildschirm“</strong> wählen</li>
					<li>Mit <strong>„Hinzufügen“</strong> bestätigen</li>
				</ol>
				<p class="small muted">In anderen Browsern auf dem iPhone geht das nicht – bitte Safari verwenden.</p>
			{:else}
				<p class="small">
					Dein Browser bietet das Installieren nicht direkt an. Öffne sein Menü (⋮) und wähle
					<strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong>.
				</p>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.install {
		margin-bottom: 1rem;
	}
	.install p,
	.install ol {
		margin: 0.5rem 0 0;
	}
	.install ol {
		padding-left: 1.25rem;
	}
</style>
