<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>E-Mail bestätigen · Split</title></svelte:head>

<div class="card narrow">
	{#if data.ok}
		<h1>✔ Adresse bestätigt</h1>
		<p><strong>{data.email}</strong> ist jetzt für Split bestätigt. Welche E-Mails du bekommst, stellst du im Profil ein.</p>
	{:else}
		<h1>Das hat nicht geklappt</h1>
		<p>{data.message}</p>
	{/if}
	<a class="button primary full" href="/profil#mail">Zu den E-Mail-Einstellungen</a>
</div>

<style>
	.narrow {
		max-width: 440px;
		margin: 2rem auto 0;
	}
</style>
