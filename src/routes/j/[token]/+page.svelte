<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Einladung · Split</title></svelte:head>

<div class="invite">
	<div class="center">
		<Avatar name={data.person.name} color={data.person.color} url={data.person.avatarUrl} size={72} />
		<h1>Hallo {data.person.name}!</h1>
		{#if data.group}
			<p class="muted">Du wurdest zu <strong>{data.group.emoji} {data.group.name}</strong> eingeladen.</p>
		{/if}
	</div>

	{#if form?.message}<p class="error">{form.message}</p>{/if}

	{#if data.user && !data.sameUser}
		<div class="card stack">
			<p>Du bist auf diesem Gerät als <strong>{data.user.name}</strong> angemeldet.</p>
			<form method="POST" action="?/merge" use:enhance>
				<button class="primary full">Ich bin {data.person.name} – mit meinem Konto verbinden</button>
				<p class="hint">
					Empfohlen, wenn du selbst gemeint bist: Die Einladung wird mit deinem bestehenden Konto
					zusammengeführt, du siehst dann alle deine Gruppen an einem Ort.
				</p>
			</form>
			<form method="POST" action="?/claim" use:enhance>
				<button class="full">Abmelden und als {data.person.name} weitermachen</button>
			</form>
		</div>
	{:else}
		<form method="POST" action="?/claim" use:enhance>
			<button class="primary full">Ja, das bin ich</button>
		</form>
		<p class="small muted center">Falls du nicht {data.person.name} bist, schließe diese Seite einfach.</p>
		<div class="card small">
			<strong>Kein Konto nötig.</strong> Du musst dich nirgends registrieren und brauchst kein Passwort. Dieser Link
			ist dein persönlicher Zugang: Um später – auch auf einem anderen Gerät – wieder reinzukommen, öffnest du einfach
			wieder diesen Link. Oder du speicherst gleich im Anschluss einen <strong>Passkey</strong> (Face ID, Fingerabdruck
			oder Geräte-PIN), dann geht es auch ohne Link.
		</div>
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
	.center h1 {
		margin-top: 0.75rem;
	}
</style>
