<script lang="ts">
	import { enhance } from '$app/forms';
	import { revertOnFailure } from '$lib/forms';

	let { data, form } = $props();
	let query = $state('');
	const filtered = $derived(
		data.kassen.filter((k) => {
			const q = query.trim().toLowerCase();
			return !q || k.name.toLowerCase().includes(q) || k.members.some((m) => m.name.toLowerCase().includes(q));
		})
	);
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head><title>Kassen · Admin · Split</title></svelte:head>

<p class="muted small">
	Alle gemeinsamen Kassen. Als Instanz-Admin kannst du jede Kasse öffnen und dort alles bearbeiten. ✔ = hat sich schon einmal
	angemeldet.
</p>
{#if form && 'message' in form && form.message}<p class="error">{form.message}</p>{/if}

<input type="search" bind:value={query} placeholder="Kasse oder Person suchen …" style="margin-bottom: 0.75rem" aria-label="Kassen suchen" />

<div class="list">
	{#each filtered as k (k.id)}
		<div class="kasse">
			<div class="row">
				<span class="grow">
					<strong>👪 {k.name}</strong>
					<span class="small muted"><br />{k.groups ? `in ${k.groups} ${k.groups === 1 ? 'Gruppe' : 'Gruppen'}` : 'in keiner Gruppe'}{#if k.createdBy}{` · angelegt von ${k.createdBy}`}{/if}</span>
				</span>
				<a href="/kassen/{k.id}" class="small">Öffnen →</a>
			</div>
			<div class="members">
				{#each k.members as m (m.personId)}
					<div class="member">
						<div class="small">{m.name}{#if m.loggedIn}{' '}<span title="hat sich schon angemeldet">✔</span>{/if}</div>
						<div class="row small roles">
							<form method="POST" action="?/manager" use:enhance={revertOnFailure}>
								<input type="hidden" name="kasseId" value={k.id} />
								<input type="hidden" name="personId" value={m.personId} />
								<label class="check"><input type="checkbox" checked={m.isManager} onchange={(e) => e.currentTarget.form?.requestSubmit()} /> Verwalter</label>
							</form>
							<form method="POST" action="?/receiver" use:enhance={revertOnFailure}>
								<input type="hidden" name="kasseId" value={k.id} />
								<input type="hidden" name="personId" value={m.personId} />
								<label class="check"
									><input type="radio" name="receiver-{k.id}" checked={k.receiverPersonId === m.personId} onchange={(e) => e.currentTarget.form?.requestSubmit()} /> empfängt Zahlungen</label
								>
							</form>
						</div>
					</div>
				{:else}
					<div class="small muted">noch niemand</div>
				{/each}
			</div>
			{#if !k.groups}
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`Kasse „${k.name}“ löschen?`)) cancel();
						return keep();
					}}
				>
					<input type="hidden" name="kasseId" value={k.id} />
					<button class="link small danger">Kasse löschen</button>
				</form>
			{/if}
		</div>
	{:else}
		<div class="muted">Keine Kassen gefunden.</div>
	{/each}
</div>

<style>
	.kasse {
		display: block !important;
	}
	.members {
		margin: 0.4rem 0 0 0.25rem;
		padding-left: 0.75rem;
		border-left: 3px solid var(--primary-soft);
	}
	.member {
		padding: 0.25rem 0;
	}
	.roles {
		gap: 0 1.25rem;
	}
	.roles .check {
		margin: 0;
		color: var(--muted);
	}
</style>
