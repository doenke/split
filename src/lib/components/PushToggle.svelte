<script lang="ts">
	import { onMount } from 'svelte';

	let status = $state<'unsupported' | 'denied' | 'off' | 'on' | 'busy'>('busy');
	let message = $state<string | null>(null);

	function urlBase64ToUint8Array(base64: string) {
		const padding = '='.repeat((4 - (base64.length % 4)) % 4);
		const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
		return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
	}

	async function registration() {
		return navigator.serviceWorker.ready;
	}

	onMount(async () => {
		if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
			status = 'unsupported';
			return;
		}
		if (Notification.permission === 'denied') {
			status = 'denied';
			return;
		}
		const sub = await (await registration()).pushManager.getSubscription();
		status = sub ? 'on' : 'off';
	});

	async function enable() {
		status = 'busy';
		message = null;
		try {
			if ((await Notification.requestPermission()) !== 'granted') {
				status = 'denied';
				return;
			}
			const { publicKey } = await (await fetch('/api/push')).json();
			const sub = await (await registration()).pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey)
			});
			const res = await fetch('/api/push', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ...sub.toJSON(), label: navigator.platform || null })
			});
			if (!res.ok) throw new Error('Speichern fehlgeschlagen');
			status = 'on';
		} catch (e) {
			message = (e as Error).message;
			status = 'off';
		}
	}

	async function disable() {
		status = 'busy';
		const sub = await (await registration()).pushManager.getSubscription();
		if (sub) {
			await fetch('/api/push', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ endpoint: sub.endpoint })
			});
			await sub.unsubscribe();
		}
		status = 'off';
	}
</script>

{#if status === 'unsupported'}
	<p class="small muted">
		Dieser Browser unterstützt keine Benachrichtigungen. Auf dem iPhone: Split erst über „Teilen → Zum Home-Bildschirm“
		installieren und dann von dort öffnen.
	</p>
{:else if status === 'denied'}
	<p class="small muted">Benachrichtigungen sind in den Browser-Einstellungen für diese Seite blockiert.</p>
{:else if status === 'on'}
	<p class="small positive">✔ Benachrichtigungen sind auf diesem Gerät aktiv.</p>
	<button class="full" onclick={disable}>Auf diesem Gerät ausschalten</button>
{:else}
	<button class="full" onclick={enable} disabled={status === 'busy'}>🔔 Benachrichtigungen aktivieren</button>
{/if}
{#if message}<p class="error small">{message}</p>{/if}
