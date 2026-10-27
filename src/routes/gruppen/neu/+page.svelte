<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const emojis = ['🧳', '🏖️', '⛷️', '🏕️', '🚐', '🏡', '🎉', '🍻', '⛵', '🚴', '🎿', '🌍'];
	let emoji = $state('🧳');
</script>

<svelte:head><title>Neue Gruppe · Split</title></svelte:head>

<h1>Neue Gruppe</h1>

<form method="POST" use:enhance class="card">
	{#if form?.message}<p class="error">{form.message}</p>{/if}
	<div class="field">
		<label for="name">Name</label>
		<input id="name" name="name" placeholder="z.B. Toskana 2027" required autocomplete="off" />
	</div>
	<div class="field">
		<span class="label">Symbol</span>
		<div class="emojis">
			{#each emojis as e (e)}
				<button type="button" class:active={emoji === e} onclick={() => (emoji = e)}>{e}</button>
			{/each}
		</div>
		<input type="hidden" name="emoji" value={emoji} />
	</div>
	<div class="field">
		<label for="currency">Währung der Gruppe</label>
		<select id="currency" name="currency">
			{#each data.currencies as c (c)}
				<option value={c} selected={c === data.defaultCurrency}>{c}</option>
			{/each}
		</select>
		<p class="hint">Alle Salden werden in dieser Währung berechnet. Ausgaben in anderen Währungen werden umgerechnet.</p>
	</div>
	<div class="row">
		<div class="field grow">
			<label for="startDate">Von (optional)</label>
			<input id="startDate" name="startDate" type="date" />
		</div>
		<div class="field grow">
			<label for="endDate">Bis (optional)</label>
			<input id="endDate" name="endDate" type="date" />
		</div>
	</div>
	<button class="primary full">Gruppe anlegen</button>
</form>

<style>
	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
	.emojis {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.emojis button {
		font-size: 1.4rem;
		padding: 0.3rem 0.5rem;
		min-height: 44px;
	}
	.emojis button.active {
		border-color: var(--primary);
		background: var(--primary-soft);
	}
</style>
