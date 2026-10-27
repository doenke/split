<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data, children } = $props();

	onMount(() => {
		if ('serviceWorker' in navigator && !import.meta.env.DEV) {
			navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
		}
	});
</script>

<header>
	<div class="bar">
		<a href="/" class="brand">
			<img src="/icon.svg" alt="" width="28" height="28" />
			<span>Split</span>
		</a>
		{#if data.user}
			<a href="/profil" class="me" aria-label="Mein Profil">
				<Avatar name={data.user.name} color={data.user.color} url={data.user.avatarUrl} size={32} />
			</a>
		{/if}
	</div>
</header>

<main class="container">
	{@render children()}
</main>

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
</style>
