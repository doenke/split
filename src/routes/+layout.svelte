<script lang="ts">
	import '../app.css';
	import { page, updated } from '$app/state';
	import { versionLabel } from '$lib/version';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { flushPending } from '$lib/offline';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data, children } = $props();
	let online = $state(true);

	// pages where a reload could throw away what the user is typing
	const editing = () => /\/(neu|ausgaben\/[^/]+)$/.test(location.pathname) || document.querySelector('form :focus') !== null;

	onMount(() => {
		// a new server version: reload as soon as it doesn't disturb
		const hadController = !!navigator.serviceWorker?.controller;
		const onControllerChange = () => {
			if (hadController && !editing()) location.reload();
		};
		navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);
		const onVisible = async () => {
			if (document.visibilityState !== 'visible') return;
			if ((await updated.check()) && !editing()) location.reload();
		};
		document.addEventListener('visibilitychange', onVisible);

		online = navigator.onLine;
		const sync = async () => {
			online = navigator.onLine;
			if (online && data.user && (await flushPending()) > 0) await invalidateAll();
		};
		sync();
		window.addEventListener('online', sync);
		window.addEventListener('offline', sync);
		return () => {
			navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('online', sync);
			window.removeEventListener('offline', sync);
		};
	});
</script>

<header>
	<div class="bar">
		<a href="/" class="brand">
			<img src="/icon.svg" alt="" width="28" height="28" />
			<span>Split</span>
		</a>
		{#if data.user}
			<nav class="nav">
				<a href="/" class:active={page.url.pathname === '/' || page.url.pathname.startsWith('/gruppen')}>Gruppen</a>
				<a href="/kassen" class:active={page.url.pathname.startsWith('/kassen')}>Kassen</a>
			</nav>
			<a href="/profil" class="me" aria-label="Mein Profil">
				<Avatar name={data.user.name} color={data.user.color} url={data.user.avatarUrl} size={32} />
			</a>
		{/if}
	</div>
</header>

{#if updated.current}
	<div class="update">
		Eine neue Version von Split ist da.
		<button class="link" onclick={() => location.reload()}>Jetzt neu laden</button>
	</div>
{/if}

{#if !online}
	<div class="offline">Offline – neue Ausgaben werden gespeichert und später übertragen.</div>
{/if}

<main class="container">
	{@render children()}
</main>

<footer class="small muted">Split {versionLabel}</footer>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		padding-top: env(safe-area-inset-top);
	}
	.bar {
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		min-height: 52px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 800;
		font-size: 1.2rem;
		color: var(--text);
		text-decoration: none;
	}
	.me {
		display: flex;
	}
	.update {
		background: var(--primary-soft);
		text-align: center;
		font-size: 0.85rem;
		padding: 0.4rem 1rem;
	}
	footer {
		text-align: center;
		padding: 0 1rem 6rem;
		margin-top: -4.5rem;
		font-size: 0.75rem;
	}
	.offline {
		background: var(--warning-bg);
		text-align: center;
		font-size: 0.85rem;
		padding: 0.4rem 1rem;
	}
	.nav {
		display: flex;
		gap: 0.25rem;
		margin-left: auto;
		margin-right: 0.75rem;
	}
	.nav a {
		color: var(--muted);
		text-decoration: none;
		font-weight: 600;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
	}
	.nav a.active {
		color: var(--text);
		background: var(--surface-2);
	}
</style>
