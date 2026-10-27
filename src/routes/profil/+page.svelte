<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import PasskeySetup from '$lib/components/PasskeySetup.svelte';
	import { formatDate } from '$lib/format';

	let { data, form } = $props();
	const user = $derived(data.user!);
</script>

<svelte:head><title>Profil · Split</title></svelte:head>

<div class="row" style="margin-bottom: 1rem">
	<Avatar name={user.name} color={user.color} url={user.avatarUrl} size={56} />
	<div>
		<h1 style="margin: 0">{user.name}</h1>
		<div class="small muted">{user.isOidc ? 'Angemeldet über Login-Anbieter' : 'Gast-Zugang'}{#if user.isInstanceAdmin} · Instanz-Admin{/if}</div>
	</div>
</div>

{#if form?.message}<p class="error">{form.message}</p>{/if}

{#if !user.isOidc}
	<form method="POST" action="?/rename" class="card" use:enhance={() => async ({ update }) => update({ reset: false })}>
		<label for="name">Dein Name</label>
		<div class="row">
			<input id="name" name="name" value={user.name} class="grow" style="width: auto" />
			<button>Speichern</button>
		</div>
	</form>
{/if}

<div class="card">
	<h2>Passkeys</h2>
	<p class="small muted">Damit kommst du ohne Passwort wieder rein – auch auf anderen Geräten oder nach dem Löschen der Browserdaten.</p>
	{#if data.passkeys.length}
		<div class="list">
			{#each data.passkeys as p (p.id)}
				<div>
					<span class="grow">🔑 {p.label ?? 'Passkey'} <span class="small muted">· seit {formatDate(p.createdAt.toISOString().slice(0, 10))}</span></span>
					<form
						method="POST"
						action="?/deletePasskey"
						use:enhance={({ cancel }) => {
							if (!confirm('Passkey entfernen?')) cancel();
						}}
					>
						<input type="hidden" name="id" value={p.id} />
						<button class="link danger">Entfernen</button>
					</form>
				</div>
			{/each}
		</div>
	{:else if !user.isOidc}
		<p class="notice small">Du hast noch keinen Passkey. Ohne Passkey bist du nur auf diesem Gerät angemeldet.</p>
	{/if}
	<PasskeySetup ondone={() => invalidateAll()} />
</div>

{#if !data.hasOidc && data.oidcEnabled}
	<div class="card">
		<h2>Login verknüpfen</h2>
		<p class="small muted">Wenn du ein Konto beim Login-Anbieter hast, kannst du es verknüpfen. Dann kannst du auch eigene Gruppen anlegen.</p>
		<a class="button full" href="/auth/oidc/login?next=/profil">{data.oidcLabel}</a>
	</div>
{/if}

<div class="card stack">
	{#if data.sessionCount > 1}
		<form method="POST" action="?/logoutOthers" use:enhance>
			<button class="full">Auf {data.sessionCount - 1} anderen Geräten abmelden</button>
		</form>
	{/if}
	<form method="POST" action="/auth/logout">
		<button class="full danger">Abmelden</button>
	</form>
</div>
