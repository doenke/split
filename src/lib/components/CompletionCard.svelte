<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from './Avatar.svelte';

	interface M {
		personId: string;
		name: string;
		color: string;
		avatarUrl: string | null;
		kasseId: string;
		kassePersonal: string | null;
		doneAt: Date | string | null;
	}
	let {
		completion,
		members,
		meId,
		myKasseId,
		kasseName,
		groupId
	}: {
		completion: { required: string[]; done: string[]; final: boolean };
		members: M[];
		meId: string;
		myKasseId: string;
		kasseName: string;
		groupId: string;
	} = $props();

	const done = $derived(new Set(completion.done));
	const meDone = $derived(done.has(meId));
	const myKasse = $derived(members.filter((m) => m.kasseId === myKasseId));
	const shared = $derived(myKasse.length > 1);
	const kasseDone = $derived(myKasse.every((m) => done.has(m.personId) || !completion.required.includes(m.personId)));
	const missing = $derived(members.filter((m) => completion.required.includes(m.personId) && !done.has(m.personId)));
	let open = $state(false);
</script>

{#if completion.final}
	<a class="card final" href="/gruppen/{groupId}/salden">
		<strong>✅ Die Endabrechnung steht.</strong>
		<span class="small">Alle haben ihre Ausgaben eingetragen. Zum Ausgleichen →</span>
	</a>
{:else if completion.required.length}
	<div class="card done-card">
		<div class="row" style="justify-content: space-between">
			<div>
				<strong>{completion.done.length} von {completion.required.length} fertig</strong>
				<div class="small muted">Wenn alle ihre Ausgaben eingetragen haben, steht die Endabrechnung.</div>
			</div>
			<button class="link small" onclick={() => (open = !open)}>{open ? 'Weniger' : 'Wer fehlt?'}</button>
		</div>
		<div class="progress"><span style:width="{(completion.done.length / completion.required.length) * 100}%"></span></div>
		{#if open}
			<div class="people small">
				{#each members.filter((m) => completion.required.includes(m.personId)) as m (m.personId)}
					<span class="person" class:ok={done.has(m.personId)}>
						<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={20} />
						{m.name}
						{done.has(m.personId) ? '✔' : '…'}
					</span>
				{/each}
			</div>
			{#if missing.length}<p class="hint">Es fehlen noch: {missing.map((m) => m.name).join(', ')}</p>{/if}
		{/if}
		<div class="row actions">
			{#if shared}
				{#if kasseDone}
					<form method="POST" action="/gruppen/{groupId}?/undone" use:enhance class="grow">
						<input type="hidden" name="scope" value="kasse" />
						<button class="full">✔ {kasseName} ist fertig – doch noch etwas eintragen</button>
					</form>
				{:else}
					<form method="POST" action="/gruppen/{groupId}?/done" use:enhance class="grow">
						<input type="hidden" name="scope" value="kasse" />
						<button class="primary full">Für {kasseName} abschließen ({myKasse.length} Personen)</button>
					</form>
					{#if !meDone}
						<form method="POST" action="/gruppen/{groupId}?/done" use:enhance>
							<input type="hidden" name="scope" value="self" />
							<button>Nur ich</button>
						</form>
					{/if}
				{/if}
			{:else if meDone}
				<form method="POST" action="/gruppen/{groupId}?/undone" use:enhance class="grow">
					<input type="hidden" name="scope" value="self" />
					<button class="full">✔ Du bist fertig – doch noch etwas eintragen</button>
				</form>
			{:else}
				<form method="POST" action="/gruppen/{groupId}?/done" use:enhance class="grow">
					<input type="hidden" name="scope" value="self" />
					<button class="primary full">Ich habe alles eingetragen</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.final {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		text-decoration: none;
		color: inherit;
		background: var(--primary-soft);
		border-color: var(--primary);
	}
	.progress {
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		margin: 0.6rem 0;
		overflow: hidden;
	}
	.progress span {
		display: block;
		height: 100%;
		background: var(--primary);
	}
	.people {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.4rem;
	}
	.person {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.5rem 0.15rem 0.2rem;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.person.ok {
		background: var(--primary-soft);
		color: var(--text);
	}
	.actions {
		flex-wrap: nowrap;
	}
</style>
