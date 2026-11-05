<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatAmount } from '$lib/format';

	let { data, form } = $props();
	let creating = $state(false);
	// already in a Kasse: a new one is most likely for others (one Kasse per person and group)
	const inAKasse = $derived(data.kassen.some((k) => k.isMember));
</script>

<svelte:head><title>Kassen · Split</title></svelte:head>

<div class="row" style="justify-content: space-between; margin-bottom: 0.5rem">
	<h1 style="margin: 0">Meine Kassen</h1>
	<!-- like groups: only people logged in via the login provider create Kassen -->
	{#if !creating && data.user?.isOidc}<button class="primary" onclick={() => (creating = true)}>+ Neue Kasse</button>{/if}
</div>
<p class="muted small">Familien oder Paare, die in allen Gruppen gemeinsam abrechnen.</p>

{#if form?.message}<p class="error">{form.message}</p>{/if}

{#if creating}
	<form method="POST" action="?/create" class="card" use:enhance>
		<label for="name">Name der Kasse</label>
		<div class="row">
			<input id="name" name="name" placeholder="z.B. Familie Jacobs" required class="grow" style="width: auto" />
			<button class="primary">Anlegen</button>
		</div>
		<label class="check" style="margin-top: 0.6rem"><input type="checkbox" name="includeMe" checked={!inAKasse} /> Ich gehöre selbst dazu</label>
		<p class="hint">Ohne Haken: Kasse für andere, z.B. befreundete Familien.</p>
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
					<div class="ellipsis"><strong>{k.name}</strong>{#if !k.isMember} <span class="badge" title="Du bist nicht Mitglied, kannst die Kasse aber verwalten, weil du sie angelegt hast.">von dir angelegt</span>{/if}</div>
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
{#if data.handedOver}
	<p class="small muted">
		{data.handedOver === 1 ? 'Eine Kasse, die du für andere angelegt hast, wird' : `${data.handedOver} Kassen, die du für andere angelegt hast, werden`}
		inzwischen von ihren Verwaltern selbst geführt und hier nicht mehr angezeigt.{#if data.user?.isInstanceAdmin}{' '}Alle Kassen findest du unter <a href="/admin/kassen">Admin → Kassen</a>.{/if}
	</p>
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
