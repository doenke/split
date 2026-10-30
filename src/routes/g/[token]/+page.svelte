<script lang="ts">
	import NameFields from '$lib/components/NameFields.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data, form } = $props();
	// svelte-ignore state_referenced_locally
	let newcomer = $state(data.people.length === 0);
</script>

<svelte:head><title>{data.group.name} · Einladung</title></svelte:head>

<div class="invite">
	<div class="center">
		<div class="emoji">{data.group.emoji}</div>
		<h1>{data.group.name}</h1>
		<p class="muted">Du wurdest eingeladen. {data.memberCount} Personen sind schon dabei.</p>
	</div>

	{#if form?.message}<p class="error">{form.message}</p>{/if}

	{#if data.user}
		<div class="card stack">
			<p>Du bist als <strong>{data.user.name}</strong> angemeldet.</p>
			<form method="POST" action="?/join" use:enhance>
				<button class="primary full">Als {data.user.name} beitreten</button>
			</form>
			{#if data.people.length}
				<p class="small muted">Oder bist du schon als eine dieser Personen eingetragen? Dann wird sie mit deinem Konto verbunden:</p>
				<div class="people">
					{#each data.people as p (p.personId)}
						<form method="POST" action="?/claim" use:enhance>
							<input type="hidden" name="personId" value={p.personId} />
							<button class="person"><Avatar name={p.name} color={p.color} url={p.avatarUrl} size={28} /> {p.name}</button>
						</form>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<p class="small muted">
			<strong>Kein Konto nötig</strong> – du wählst nur aus, wer du bist. Auf diesem Gerät bleibst du angemeldet. Für
			später oder ein anderes Gerät speicherst du danach einen Passkey (Face ID, Fingerabdruck oder Geräte-PIN).
		</p>
		{#if data.people.length && !newcomer}
			<h2>Wer bist du?</h2>
			<div class="list">
				{#each data.people as p (p.personId)}
					<form method="POST" action="?/claim" use:enhance>
						<input type="hidden" name="personId" value={p.personId} />
						<button class="row-btn">
							<Avatar name={p.name} color={p.color} url={p.avatarUrl} size={36} />
							<span class="grow">{p.name}</span>
							<span>→</span>
						</button>
					</form>
				{/each}
			</div>
			<button class="link" onclick={() => (newcomer = true)}>Ich stehe nicht in der Liste</button>
		{:else}
			<form method="POST" action="?/join" class="card" use:enhance>
				<p style="margin-top: 0"><strong>Wie heißt du?</strong></p>
				<NameFields self firstPlaceholder="" />
				<button class="primary full" style="margin-top: 0.75rem">Beitreten</button>
				{#if data.people.length}
					<button type="button" class="link" style="margin-top: 0.5rem" onclick={() => (newcomer = false)}>Zurück zur Liste</button>
				{/if}
			</form>
		{/if}
		<p class="small muted">Du hast schon einen Passkey für Split? <a href="/login?next=/g/{page.params.token}">Anmelden</a></p>
	{/if}
</div>

<style>
	.invite {
		max-width: 440px;
		margin: 2rem auto 0;
	}
	.center {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	.emoji {
		font-size: 3rem;
	}
	.people {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.person {
		border-radius: 999px;
		padding: 0.25rem 0.75rem 0.25rem 0.3rem;
		font-weight: 500;
	}
	.list form {
		padding: 0 !important;
	}
	.row-btn {
		width: 100%;
		border: 0;
		border-radius: 0;
		background: transparent;
		justify-content: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		font-weight: 500;
	}
</style>
