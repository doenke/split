<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatAmount } from '$lib/format';

	let { data, form } = $props();
	let creating = $state(false);
</script>

<svelte:head><title>Kassen · Split</title></svelte:head>

<div class="row" style="justify-content: space-between; margin-bottom: 0.5rem">
	<h1 style="margin: 0">Meine Kassen</h1>
	{#if !creating}<button class="primary" onclick={() => (creating = true)}>+ Neue Kasse</button>{/if}
</div>
<p class="muted small">
	Eine Kasse fasst Personen zusammen, die gemeinsam abrechnen – z.B. eine Familie oder ein Paar. Sie gilt in
	allen Gruppen: Wer innerhalb der Kasse was bezahlt hat, ist egal, nach außen zählt nur die Kasse.
</p>

{#if form?.message}<p class="error">{form.message}</p>{/if}

{#if creating}
	<form method="POST" action="?/create" class="card" use:enhance>
		<label for="name">Name der Kasse</label>
		<div class="row">
			<input id="name" name="name" placeholder="z.B. Familie Jacobs" required class="grow" style="width: auto" />
			<button class="primary">Anlegen</button>
		</div>
		<label class="check" style="margin-top: 0.6rem"><input type="checkbox" name="includeMe" checked /> Ich gehöre selbst dazu</label>
		<p class="hint">Ohne Haken legst du die Kasse für andere an, z.B. für befreundete Familien. Du verwaltest sie dann, ohne selbst mitzurechnen.</p>
	</form>
{/if}

{#if data.kassen.length === 0 && !creating}
	<div class="card muted">Du bist noch in keiner gemeinsamen Kasse. Ohne Kasse rechnest du für dich allein ab.</div>
{:else}
	<div class="list">
		{#each data.kassen as k (k.id)}
			<a href="/kassen/{k.id}">
				<div class="avatars">
					{#each k.members.slice(0, 4) as m (m.personId)}
						<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={30} />
					{/each}
				</div>
				<div class="grow">
					<div class="ellipsis"><strong>{k.name}</strong>{#if !k.isMember} <span class="badge">von dir verwaltet</span>{/if}</div>
					<div class="small muted ellipsis">{k.members.map((m) => m.name).join(', ') || 'noch niemand'}</div>
				</div>
				<div class="right">
					{#each k.totals.filter((t) => t.amount !== 0) as t (t.currency)}
						<div class="amount {t.amount > 0 ? 'positive' : 'negative'}">{t.amount > 0 ? '+' : ''}{formatAmount(t.amount, t.currency)}</div>
					{:else}
						<span class="small muted">ausgeglichen</span>
					{/each}
				</div>
			</a>
		{/each}
	</div>
{/if}

<style>
	.avatars {
		display: flex;
	}
	.avatars :global(> * + *) {
		margin-left: -10px;
		box-shadow: 0 0 0 2px var(--surface);
	}
</style>
