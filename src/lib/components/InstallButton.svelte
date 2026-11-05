<script lang="ts">
	import { onMount } from 'svelte';

	interface InstallPrompt extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}
	type W = Window & { __installPrompt?: InstallPrompt | null };

	/** Compact "install as app" button for the title bar; only where installing is possible from here. */
	let installed = $state(false);
	let prompt = $state<InstallPrompt | null>(null);
	let ios = $state(false);
	let help = $state(false);
	let ready = $state(false);
	let box = $state<HTMLElement>();

	onMount(() => {
		installed =
			matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
		ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		const update = () => (prompt = (window as W).__installPrompt ?? null);
		update();
		ready = true;
		addEventListener('split:installable', update);
		const onInstalled = () => (installed = true);
		addEventListener('appinstalled', onInstalled);
		// close the iOS help on a tap elsewhere or Esc
		const onClick = (e: MouseEvent) => {
			if (help && box && !box.contains(e.target as Node)) help = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') help = false;
		};
		addEventListener('click', onClick);
		addEventListener('keydown', onKey);
		return () => {
			removeEventListener('split:installable', update);
			removeEventListener('appinstalled', onInstalled);
			removeEventListener('click', onClick);
			removeEventListener('keydown', onKey);
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

	const show = $derived(ready && !installed && (prompt !== null || ios));
</script>

{#if show}
	<div class="install" bind:this={box}>
		<button type="button" class="small" onclick={install} aria-expanded={prompt ? undefined : help}>📲 Installieren</button>
		{#if help}
			<div class="pop card small">
				<strong>Split als App installieren</strong>
				<ol>
					<li>In Safari unten auf <strong>Teilen</strong> <span aria-hidden="true">(□↑)</span> tippen</li>
					<li><strong>„Zum Home-Bildschirm“</strong> wählen</li>
					<li>Mit <strong>„Hinzufügen“</strong> bestätigen</li>
				</ol>
				<p class="muted">In anderen Browsern auf dem iPhone geht das nicht – bitte Safari verwenden.</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.install {
		position: relative;
	}
	.install > button {
		padding: 0.35rem 0.7rem;
		white-space: nowrap;
	}
	.pop {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		width: min(18rem, calc(100vw - 2rem));
		margin: 0;
		z-index: 20;
		text-align: left;
		font-weight: normal;
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.15);
	}
	.pop ol {
		padding-left: 1.25rem;
		margin: 0.5rem 0;
	}
	.pop p {
		margin: 0;
	}
</style>
