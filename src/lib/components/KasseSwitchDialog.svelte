<script lang="ts">
	/** Tells the user in which groups people now settle together via their Kasse. */
	let { switched = [] }: { switched?: { groupId: string; groupName: string; kasseName: string; names: string[] }[] } = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (switched.length && dialog && !dialog.open) dialog.showModal();
	});
	const list = (names: string[]) => (names.length > 1 ? names.slice(0, -1).join(', ') + ' und ' + names.at(-1) : names[0]);
</script>

<dialog bind:this={dialog} class="switch" aria-labelledby="switch-title">
	<h2 id="switch-title">Abrechnung umgestellt</h2>
	<p>Wer in derselben Kasse ist, gleicht in einer Gruppe gemeinsam aus. Deshalb rechnen jetzt gemeinsam ab:</p>
	<ul>
		{#each switched as s (s.groupId + s.kasseName)}
			<li>
				<a href="/gruppen/{s.groupId}/salden"><strong>{s.groupName}</strong></a>: {list(s.names)}
				{s.names.length > 1 ? 'rechnen' : 'rechnet'} jetzt über die Kasse <strong>{s.kasseName}</strong> ab
			</li>
		{/each}
	</ul>
	<p class="small muted">Abgeschlossene Gruppen bleiben unverändert. Unter „Mitglieder“ lässt sich das je Person wieder ändern.</p>
	<form method="dialog"><button class="primary full">OK</button></form>
</dialog>

<style>
	.switch {
		max-width: min(440px, calc(100vw - 2rem));
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: inherit;
		padding: 1.25rem;
		box-shadow: var(--shadow);
	}
	.switch::backdrop {
		background: rgb(0 0 0 / 0.4);
	}
	h2 {
		margin-top: 0;
	}
	ul {
		padding-left: 1.2rem;
	}
	li + li {
		margin-top: 0.4rem;
	}
</style>
