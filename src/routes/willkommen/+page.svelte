<script lang="ts">
	import PasskeySetup from '$lib/components/PasskeySetup.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Willkommen · Split</title></svelte:head>

<div class="welcome">
	<h1>Willkommen, {data.user?.name}! 🎉</h1>
	<div class="card stack">
		{#if !data.hasPasskey}
			<p>
				Damit du auch später – oder auf einem anderen Gerät – wieder reinkommst, lege jetzt einen
				<strong>Passkey</strong> an. Das geht mit Face ID, Fingerabdruck oder der Geräte-PIN. Ein Passwort
				brauchst du nicht.
			</p>
			<PasskeySetup />
		{/if}
		<a class="button full" href={data.next}>Weiter</a>
		<p class="small muted">
			Tipp: Füge Split über das Browser-Menü zum Home-Bildschirm hinzu – dann verhält es sich wie eine App.
		</p>
	</div>
</div>

<style>
	.welcome {
		max-width: 440px;
		margin: 2rem auto 0;
	}
</style>
