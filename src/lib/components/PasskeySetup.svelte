<script lang="ts">
	import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
	import { onMount } from 'svelte';

	let { ondone }: { ondone?: () => void } = $props();
	let supported = $state(true);
	let busy = $state(false);
	let done = $state(false);
	let message = $state<string | null>(null);

	onMount(() => (supported = browserSupportsWebAuthn()));

	function deviceLabel() {
		const ua = navigator.userAgent;
		if (/iPhone/.test(ua)) return 'iPhone';
		if (/iPad/.test(ua)) return 'iPad';
		if (/Android/.test(ua)) return 'Android';
		if (/Mac/.test(ua)) return 'Mac';
		if (/Windows/.test(ua)) return 'Windows';
		return 'Gerät';
	}

	async function register() {
		busy = true;
		message = null;
		try {
			const optionsJSON = await (await fetch('/auth/passkey/register')).json();
			const response = await startRegistration({ optionsJSON });
			const res = await fetch('/auth/passkey/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-device-label': deviceLabel() },
				body: JSON.stringify(response)
			});
			if (!res.ok) throw new Error((await res.json()).message);
			done = true;
			ondone?.();
		} catch (e) {
			message = (e as Error).name === 'NotAllowedError' ? 'Abgebrochen.' : (e as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

{#if done}
	<p class="positive">✔ Passkey gespeichert. Du kannst dich jetzt jederzeit wieder anmelden.</p>
{:else if supported}
	<button class="primary full" onclick={register} disabled={busy}>🔑 Passkey anlegen</button>
	{#if message}<p class="error small">{message}</p>{/if}
{:else}
	<p class="small muted">Dieses Gerät unterstützt keine Passkeys. Du bleibst über dieses Gerät angemeldet.</p>
{/if}
