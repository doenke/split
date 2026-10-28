<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();
	const base = $derived(`/gruppen/${data.group.id}`);
	const tabs = $derived([
		{ href: base, label: 'Ausgaben' },
		{ href: `${base}/salden`, label: 'Salden' },
		{ href: `${base}/mitglieder`, label: 'Mitglieder' },
		{ href: `${base}/einstellungen`, label: 'Einstellungen' }
	]);
	const active = (href: string) =>
		href === base ? page.url.pathname === base : page.url.pathname.startsWith(href);
</script>

<div class="head noprint">
	<span class="emoji">{data.group.emoji}</span>
	<h1>{data.group.name}</h1>
</div>

<nav class="segmented tabs noprint">
	{#each tabs as t (t.href)}
		<a href={t.href} class:active={active(t.href)}>{t.label}</a>
	{/each}
</nav>

{#if data.balances.errors.length}
	<div class="notice small noprint">
		⚠️ {data.balances.errors.length} Ausgabe(n) können nicht aufgeteilt werden und zählen nicht zu den Salden.
		{#each data.balances.errors as e (e.expenseId)}
			<div><a href="{base}/ausgaben/{e.expenseId}">{data.expenses.find((x) => x.id === e.expenseId)?.title}</a>: {e.message}</div>
		{/each}
	</div>
{/if}

{@render children()}

<style>
	.head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
	}
	.head h1 {
		margin: 0;
	}
	.emoji {
		font-size: 2rem;
	}
	.tabs {
		margin-bottom: 1rem;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.tabs a {
		flex: 1;
		text-align: center;
		padding: 0.5rem 0.3rem;
		border-radius: 8px;
		color: var(--text);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
		white-space: nowrap;
	}
	@media (max-width: 400px) {
		.tabs a {
			font-size: 0.82rem;
			padding: 0.5rem 0.2rem;
		}
	}
	.tabs a.active {
		background: var(--surface);
		box-shadow: var(--shadow);
		font-weight: 700;
	}
</style>
