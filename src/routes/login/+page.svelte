<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { startAuthentication } from '@simplewebauthn/browser';

	let { data } = $props();
	let passkeyError = $state<string | null>(null);
	let busy = $state(false);
	const next = $derived(page.url.searchParams.get('next') ?? '/');

	async function loginWithPasskey() {
		passkeyError = null;
		busy = true;
		try {
			const optionsJSON = await (await fetch('/auth/passkey/login')).json();
			const response = await startAuthentication({ optionsJSON });
			const res = await fetch('/auth/passkey/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(response)
			});
			if (!res.ok) throw new Error((await res.json()).message ?? 'Anmeldung fehlgeschlagen');
			await goto(next, { invalidateAll: true });
		} catch (e) {
			passkeyError = (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Anmelden · Split</title></svelte:head>

<div class="login">
	<h1>Willkommen bei Split</h1>
	<p class="muted">Gemeinsame Ausgaben fair aufteilen – für Reisen, Familien und Freunde.</p>

	{#if data.error}<p class="error">{data.error}</p>{/if}

	<div class="card stack">
		{#if data.oidcEnabled}
			<a class="button primary full" href="/auth/oidc/login?next={encodeURIComponent(next)}">{data.oidcLabel}</a>
		{/if}
		<button class="full" onclick={loginWithPasskey} disabled={busy}>🔑 Mit Passkey anmelden</button>
		{#if passkeyError}<p class="error small">{passkeyError}</p>{/if}
		{#if data.devLogin}
			<form method="POST" action="/auth/dev-login" class="row">
				<input name="name" placeholder="Name (Dev-Login)" required class="grow" />
				<button>Dev-Login</button>
			</form>
		{/if}
	</div>

	<p class="small muted">
		Kein Konto? Kein Problem: Wer zu einer Gruppe eingeladen wird, bekommt einen persönlichen Link und
		ist mit einem Tipp dabei – ganz ohne Passwort.
	</p>
</div>

<style>
	.login {
		max-width: 420px;
		margin: 2rem auto 0;
	}
</style>
