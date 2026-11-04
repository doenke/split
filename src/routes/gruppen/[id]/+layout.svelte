<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();
	const base = $derived(`/gruppen/${data.group.id}`);
	// three tabs like a simple app: everything about the group itself lives under "Gruppe"
	const groupPages = $derived([
		{ href: `${base}/mitglieder`, label: 'Mitglieder' },
		{ href: `${base}/profile`, label: 'Profile' },
		{ href: `${base}/einstellungen`, label: 'Einstellungen' }
	]);
	const at = (...paths: string[]) => paths.some((p) => page.url.pathname.startsWith(`${base}/${p}`));
	const inGroup = $derived(at('mitglieder', 'profile', 'einstellungen', 'papierkorb'));
	const tabs = $derived([
		{ href: base, label: 'Ausgaben', active: !at('salden', 'kosten') && !inGroup },
		{ href: `${base}/salden`, label: 'Salden', active: at('salden', 'kosten') },
		{ href: `${base}/mitglieder`, label: 'Gruppe', active: inGroup }
	]);
</script>

<div class="head noprint">
	<span class="emoji">{data.group.emoji}</span>
	<h1>{data.group.name}</h1>
</div>

<nav class="segmented tabs noprint">
	{#each tabs as t (t.href)}
		<a href={t.href} class:active={t.active}>{t.label}</a>
	{/each}
</nav>
{#if inGroup}
	<nav class="subnav noprint">
		{#each groupPages as t (t.href)}
			<a href={t.href} class:active={page.url.pathname.startsWith(t.href)}>{t.label}</a>
		{/each}
	</nav>
{/if}

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
	.subnav {
		display: flex;
		gap: 1.2rem;
		margin: -0.4rem 0.25rem 1rem;
		font-size: 0.9rem;
	}
	.subnav a {
		color: var(--muted);
		text-decoration: none;
		padding-bottom: 0.15rem;
		border-bottom: 2px solid transparent;
	}
	.subnav a.active {
		color: var(--text);
		font-weight: 600;
		border-bottom-color: var(--primary);
	}
	.tabs a.active {
		background: var(--surface);
		box-shadow: var(--shadow);
		font-weight: 700;
	}
</style>
