<script lang="ts">
	import AppAddress from '$lib/components/AppAddress.svelte';
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import PasskeySetup from '$lib/components/PasskeySetup.svelte';
	import PushToggle from '$lib/components/PushToggle.svelte';
	import { formatDate } from '$lib/format';

	let { data, form } = $props();
	const user = $derived(data.user!);

	// profile picture: cropped to a square and made small on the device, then uploaded
	let avatarInput = $state<HTMLInputElement>();
	let avatarBusy = $state(false);
	let avatarError = $state('');
	async function square(file: File, size = 256): Promise<Blob> {
		const img = await createImageBitmap(file);
		const side = Math.min(img.width, img.height);
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = size;
		canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
		return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.85));
	}
	async function uploadAvatar(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		avatarBusy = true;
		avatarError = '';
		try {
			const body = new FormData();
			body.set('avatar', new File([await square(file)], 'avatar.jpg', { type: 'image/jpeg' }));
			const res = await fetch('?/avatar', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			const result = deserialize(await res.text());
			if (result.type === 'failure') avatarError = String(result.data?.message ?? 'Hochladen fehlgeschlagen.');
			else if (result.type === 'error') avatarError = 'Hochladen fehlgeschlagen.';
			await invalidateAll();
		} catch {
			avatarError = 'Dieses Bild konnte nicht gelesen werden – bitte ein anderes Foto wählen.';
		} finally {
			avatarBusy = false;
			if (avatarInput) avatarInput.value = '';
		}
	}

</script>

<svelte:head><title>Profil · Split</title></svelte:head>

<div class="row" style="margin-bottom: 1rem">
	<button type="button" class="avatar-btn" onclick={() => avatarInput?.click()} aria-label="Profilbild ändern" title="Profilbild ändern" disabled={avatarBusy}>
		<Avatar name={user.name} color={user.color} url={user.avatarUrl} size={56} />
		<span class="cam" aria-hidden="true">{avatarBusy ? '…' : '📷'}</span>
	</button>
	<input bind:this={avatarInput} type="file" accept="image/*" hidden onchange={uploadAvatar} />
	<div>
		<h1 style="margin: 0">{user.name}</h1>
		{#if user.fullName !== user.name}<div class="small muted">{user.fullName}</div>{/if}
		<div class="small muted">{user.isOidc ? `Angemeldet über ${data.loginProvider}` : 'Gast-Zugang'}{#if user.isInstanceAdmin} · Instanz-Admin{/if}</div>
	</div>
</div>

{#if form?.message}<p class="error">{form.message}</p>{/if}
{#if avatarError}<p class="error">{avatarError}</p>{/if}
<div class="row small avatar-actions">
	<button type="button" class="link" onclick={() => avatarInput?.click()} disabled={avatarBusy}>Profilbild {user.avatarUrl ? 'ändern' : 'hochladen'}</button>
	{#if user.avatarUrl?.startsWith('/avatare/')}
		<form method="POST" action="?/removeAvatar" use:enhance><button class="link danger">Entfernen</button></form>
	{/if}
</div>

<div class="row" style="margin-bottom: 1rem">
	<a href="/kassen" class="button grow">👪 Kassen</a>
	<a href="/hilfe" class="button grow">❓ Hilfe</a>
</div>

{#if user.isInstanceAdmin}
	<a href="/admin" class="button full" style="margin-bottom: 1rem">🛠️ Admin: Gruppen, Kassen, Personen</a>
{/if}

<form method="POST" action="?/rename" class="card" use:enhance={() => async ({ update }) => update({ reset: false })}>
	<h2>Name</h2>
	{#if !user.isOidc}
		<div class="field">
			<label for="name">Vor- und Nachname</label>
			<input id="name" name="name" value={user.fullName} autocomplete="name" />
		</div>
	{/if}
	<div class="field">
		<label for="displayName">Anzeigename (optional)</label>
		<input id="displayName" name="displayName" value={data.displayName} placeholder={user.name} maxlength="40" />
		<p class="hint">Leer = automatisch{data.displayName ? '' : ` („${user.name}“)`}.</p>
	</div>
	<button class="full">{form?.saved ? '✔ Gespeichert' : 'Speichern'}</button>
</form>

<div class="card">
	<h2>Passkeys</h2>
	<p class="small muted">Ohne Passwort wieder rein, auch auf anderen Geräten: <AppAddress /> öffnen → „Mit Passkey anmelden“.</p>
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

<div class="card">
	<h2>Benachrichtigungen</h2>
	<PushToggle />
</div>

{#if data.mail.enabled}
	<div class="card" id="mail">
		<h2>E-Mails</h2>
		{#if form?.mailError}<p class="error">{form.mailError}</p>{/if}
		{#if data.mail.fromOidc}
			<p class="small">Adresse: <strong>{data.mail.email}</strong> <span class="muted">(von {data.loginProvider})</span></p>
		{:else}
			<form method="POST" action="?/saveEmail" use:enhance={() => async ({ update }) => update({ reset: false })}>
				<label for="email">Deine E-Mail-Adresse (optional)</label>
				<div class="row">
					<input id="email" name="email" type="email" value={data.mail.email ?? ''} autocomplete="email" class="grow" style="width: auto" />
					<button>Speichern</button>
				</div>
			</form>
			{#if data.mail.email && !data.mail.verified}
				<p class="notice small">
					{form?.confirmationSent ? 'Wir haben dir eine E-Mail geschickt.' : 'Noch nicht bestätigt.'} Bitte klicke auf den Link darin – vorher
					schickt Split keine E-Mails an diese Adresse.
				</p>
				<form method="POST" action="?/resendConfirmation" use:enhance><button class="link small">Bestätigungs-E-Mail erneut senden</button></form>
			{:else if data.mail.email}
				<p class="hint">✔ Bestätigt</p>
			{:else}
				<p class="hint">Nur für E-Mails von Split.</p>
			{/if}
		{/if}

		{#if data.mail.email && data.mail.verified}
			<form method="POST" action="?/saveMailPrefs" use:enhance={() => async ({ update }) => update({ reset: false })} class="prefs">
				{#each data.mail.kinds as k (k.key)}
					<label class="check"><input type="checkbox" name={k.key} checked={data.mail.prefs[k.key as keyof typeof data.mail.prefs]} /> {k.label}</label>
				{/each}
				<label class="check none"><input type="checkbox" name="none" checked={data.mail.none} /> <span><strong>Gar keine E-Mails</strong> (außer Einladungen und Bestätigungen)</span></label>
				<button class="primary full">{form?.prefsSaved ? '✔ Gespeichert' : 'Speichern'}</button>
			</form>
		{/if}
	</div>
{/if}

<form method="POST" action="?/savePayment" class="card" use:enhance={() => async ({ update }) => update({ reset: false })}>
	<h2>So bekommst du Geld</h2>
	{#if form?.paymentError}<p class="error">{form.paymentError}</p>{/if}
	{#if form?.paymentSaved}<p class="positive">✔ Gespeichert</p>{/if}
	<div class="field">
		<label for="weroContact">Wero: E-Mail oder Handynummer</label>
		<input id="weroContact" name="weroContact" value={data.payment?.weroContact ?? ''} autocomplete="off" />
	</div>
	<div class="field">
		<label for="iban">IBAN (für GiroCode / Überweisung)</label>
		<input id="iban" name="iban" value={data.payment?.iban ?? ''} autocomplete="off" />
	</div>
	<div class="field">
		<label for="accountHolder">Kontoinhaber</label>
		<input id="accountHolder" name="accountHolder" value={data.payment?.accountHolder ?? ''} placeholder={user.fullName} />
	</div>
	<div class="field">
		<label for="paypalMe">PayPal.me-Name</label>
		<input id="paypalMe" name="paypalMe" value={data.payment?.paypalMe ?? ''} placeholder="z.B. AnnaMuster oder paypal.me/AnnaMuster" autocomplete="off" />
	</div>
	<p class="hint">Sichtbar nur für Personen, mit denen du in einer Gruppe bist.</p>
	<button class="primary full">Speichern</button>
</form>

{#if !data.hasOidc && data.oidcEnabled}
	<div class="card">
		<h2>Login verknüpfen</h2>
		<p class="small muted">Wenn du ein Konto bei {data.loginProvider} hast, kannst du es verknüpfen. Dann kannst du auch eigene Gruppen anlegen.</p>
		<a class="button full" href="/auth/oidc/login?next=/profil">{data.oidcLabel}</a>
	</div>
{/if}

<div class="card" id="ki">
	<h2>KI-Assistenten (MCP)</h2>
	<p class="small muted">Für Claude & Co. – mit deinen Rechten. <a href="/hilfe#mcp">Anleitung</a></p>
	{#if form?.apiKey}
		<div class="newkey">
			<p class="small"><strong>Dein neuer Schlüssel</strong> – er wird nur jetzt angezeigt, kopiere ihn gleich:</p>
			<input readonly value={form.apiKey} onfocus={(e) => e.currentTarget.select()} />
			<p class="small" style="margin-bottom: 0.25rem">Adresse des MCP-Servers:</p>
			<input readonly value={data.mcpUrl} onfocus={(e) => e.currentTarget.select()} />
			<p class="small" style="margin-bottom: 0.25rem">Für Claude Code:</p>
			<textarea readonly rows="3" onfocus={(e) => e.currentTarget.select()}>claude mcp add --transport http split {data.mcpUrl} --header "Authorization: Bearer {form.apiKey}"</textarea>
		</div>
	{/if}
	{#if data.apiKeys.length}
		<div class="list">
			{#each data.apiKeys as k (k.id)}
				<div>
					<span class="grow">
						🤖 {k.label}
						<span class="small muted">· seit {formatDate(k.createdAt.slice(0, 10))}{k.lastUsedAt ? ` · zuletzt ${formatDate(k.lastUsedAt.slice(0, 10))}` : ' · noch nie benutzt'}</span>
					</span>
					<form
						method="POST"
						action="?/revokeApiKey"
						use:enhance={({ cancel }) => {
							if (!confirm(`Schlüssel „${k.label}“ widerrufen? Der Assistent hat dann keinen Zugriff mehr.`)) cancel();
						}}
					>
						<input type="hidden" name="id" value={k.id} />
						<button class="link danger">Widerrufen</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}
	<form method="POST" action="?/createApiKey" use:enhance class="row">
		<input name="label" placeholder="Name, z.B. Claude am Laptop" class="grow" style="width: auto" aria-label="Name des Schlüssels" />
		<button>Schlüssel erzeugen</button>
	</form>
</div>

<div class="card">
	<h2>Weiteres Gerät</h2>
	{#if form?.pairing}
		<p class="small">Mit dem anderen Gerät scannen – der Code gilt 10 Minuten und nur einmal.</p>
		<div class="center"><div class="qr">{@html form.pairing.qr}</div></div>
		<input readonly value={form.pairing.url} onfocus={(e) => e.currentTarget.select()} />
	{:else}
		<p class="small muted">Code anzeigen und mit dem anderen Gerät scannen.</p>
		<form method="POST" action="?/pairDevice" use:enhance><button class="full">📱 Gerät hinzufügen</button></form>
	{/if}
</div>

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

<style>
	.avatar-btn {
		position: relative;
		padding: 0;
		border: 0;
		background: none;
		border-radius: 50%;
		min-height: 0;
	}
	.avatar-btn .cam {
		position: absolute;
		right: -4px;
		bottom: -4px;
		font-size: 0.8rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 50%;
		width: 1.5rem;
		height: 1.5rem;
		display: grid;
		place-items: center;
	}
	.avatar-actions {
		margin: -0.5rem 0 1rem;
		gap: 1rem;
	}
	.prefs {
		margin-top: 0.75rem;
	}
	.prefs .check {
		margin-bottom: 0.4rem;
	}
	.prefs .none {
		margin: 0.6rem 0 0.75rem;
		padding-top: 0.6rem;
		border-top: 1px solid var(--border);
	}
	.newkey {
		background: var(--surface-2);
		border-radius: 10px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.newkey input,
	.newkey textarea {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		width: 100%;
	}
	.center {
		text-align: center;
	}
	.qr {
		display: inline-block;
		background: #fff;
		padding: 8px;
		border-radius: 10px;
		margin: 0.5rem 0;
	}
	.qr :global(svg) {
		display: block;
		width: 200px;
		height: 200px;
	}
</style>
