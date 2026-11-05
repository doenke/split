<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/format';
	import { phaseLabels } from '$lib/core/phase';

	let { data, form } = $props();
	let query = $state('');
	let open = $state<string | null>(null);
	const filtered = $derived(
		data.groups.filter((g) => {
			const q = query.trim().toLowerCase();
			return !q || g.name.toLowerCase().includes(q) || g.members.some((m) => m.name.toLowerCase().includes(q));
		})
	);
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head><title>Gruppen · Admin · Split</title></svelte:head>

<p class="muted small">Alle Gruppen dieser Split-Instanz. Öffnen können sie nur ihre Mitglieder – hier lassen sich Admins, Archiv und Papierkorb regeln.</p>
{#if form && 'message' in form && form.message}<p class="error">{form.message}</p>{/if}

<input type="search" bind:value={query} placeholder="Gruppe oder Person suchen …" style="margin-bottom: 0.75rem" aria-label="Gruppen suchen" />

<div class="list">
	{#each filtered as g (g.id)}
		<div class="group" class:deleted={g.deletedAt}>
			<button type="button" class="head" onclick={() => (open = open === g.id ? null : g.id)} aria-expanded={open === g.id}>
				<span class="emoji">{g.emoji}</span>
				<span class="grow">
					<strong>{g.name}</strong>
					<span class="small muted">
						<br />{g.deletedAt ? 'im Papierkorb' : phaseLabels[g.phase]} · {g.members.length} Personen · {g.expenses} Ausgaben · von {g.createdBy},
						{formatDate(g.createdAt.slice(0, 10))}
					</span>
				</span>
				<span class="muted">{open === g.id ? '▴' : '▾'}</span>
			</button>
			{#if open === g.id}
				<div class="body">
					<div class="small label">Mitglieder</div>
					{#each g.members as m (m.personId)}
						<form method="POST" action="?/role" class="row member" use:enhance={keep}>
							<input type="hidden" name="groupId" value={g.id} />
							<input type="hidden" name="personId" value={m.personId} />
							<input type="hidden" name="role" value={m.role === 'admin' ? 'member' : 'admin'} />
							<span class="grow">{m.name}{#if m.role === 'admin'}{' '}<span class="badge">Admin</span>{/if}</span>
							<button class="link small">{m.role === 'admin' ? 'Kein Admin' : 'Zum Admin machen'}</button>
						</form>
					{/each}
					<div class="row actions">
						<form method="POST" action="?/archive" use:enhance={keep}>
							<input type="hidden" name="groupId" value={g.id} />
							<button class="small">{g.archived ? 'Aus dem Archiv holen' : 'Archivieren'}</button>
						</form>
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!g.deletedAt && !confirm(`„${g.name}“ in den Papierkorb legen? Nach 30 Tagen wird sie endgültig gelöscht.`)) cancel();
								return keep();
							}}
						>
							<input type="hidden" name="groupId" value={g.id} />
							<button class="small" class:danger={!g.deletedAt}>{g.deletedAt ? 'Wiederherstellen' : 'Löschen'}</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="muted">Keine Gruppen gefunden.</div>
	{/each}
</div>

<style>
	.group {
		display: block !important;
		padding: 0 !important;
	}
	.group.deleted {
		opacity: 0.6;
	}
	.head {
		display: flex;
		width: 100%;
		gap: 0.75rem;
		align-items: center;
		text-align: left;
		background: none;
		border: 0;
		border-radius: 0;
		padding: 0.75rem 1rem;
		font-weight: normal;
	}
	.emoji {
		font-size: 1.4rem;
	}
	.body {
		padding: 0 1rem 0.75rem 3.2rem;
	}
	.label {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}
	.member {
		padding: 0.15rem 0;
	}
	.actions {
		margin-top: 0.6rem;
		gap: 0.5rem;
	}
</style>
