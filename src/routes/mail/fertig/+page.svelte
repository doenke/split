<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<svelte:head><title>Abschließen · Split</title></svelte:head>

<div class="card narrow">
	{#if !data.token}
		<h1>Link ungültig</h1>
		<p>Öffne die Gruppe in Split und tippe dort auf „Ich habe alles eingetragen“.</p>
		<a class="button full" href="/">Zu Split</a>
	{:else if form?.done || data.alreadyDone || data.final}
		<h1>✔ Erledigt</h1>
		<p>
			{#if form?.final || data.final}
				Alle sind fertig – die Endabrechnung von „{data.group?.name}“ steht.
			{:else}
				Danke, {data.name}! Du bist bei „{data.group?.name}“ fertig. Sobald alle abgeschlossen haben, steht die Endabrechnung.
			{/if}
		</p>
		<a class="button full" href="/gruppen/{data.group?.id}">Zur Gruppe</a>
	{:else}
		<h1>{data.group?.emoji} {data.group?.name}</h1>
		<p>Hallo {data.name}, hast du alle deine Ausgaben eingetragen – oder hattest du keine?</p>
		{#if form?.message}<p class="error">{form.message}</p>{/if}
		<form method="POST" use:enhance>
			<input type="hidden" name="t" value={data.token} />
			<button class="primary full">Ja, ich bin fertig – abschließen</button>
		</form>
		<a class="button full" style="margin-top: 0.5rem" href="/gruppen/{data.group?.id}">Nein, erst noch Ausgaben eintragen</a>
	{/if}
</div>

<style>
	.narrow {
		max-width: 440px;
		margin: 2rem auto 0;
	}
</style>
