<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<svelte:head><title>E-Mails abbestellen · Split</title></svelte:head>

<div class="card narrow">
	{#if form?.done}
		<h1>✔ Abbestellt</h1>
		<p>Du bekommst keine E-Mails mehr zu „{data.label}“. Alle Einstellungen findest du im Profil.</p>
		<a class="button full" href="/profil#mail">Zu den E-Mail-Einstellungen</a>
	{:else if data.token}
		<h1>E-Mails abbestellen</h1>
		<p>Keine E-Mails mehr zu „{data.label}“?</p>
		{#if form?.message}<p class="error">{form.message}</p>{/if}
		<form method="POST" use:enhance>
			<input type="hidden" name="t" value={data.token} />
			<button class="primary full">Abbestellen</button>
		</form>
	{:else}
		<h1>Link ungültig</h1>
		<p>Deine E-Mail-Einstellungen kannst du im Profil ändern.</p>
		<a class="button full" href="/profil#mail">Zum Profil</a>
	{/if}
</div>

<style>
	.narrow {
		max-width: 440px;
		margin: 2rem auto 0;
	}
</style>
