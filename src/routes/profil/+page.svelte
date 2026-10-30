<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import PasskeySetup from '$lib/components/PasskeySetup.svelte';
	import PushToggle from '$lib/components/PushToggle.svelte';
	import InstallButton from '$lib/components/InstallButton.svelte';
	import { addDays, formatDate } from '$lib/format';

	let { data, form } = $props();
	const user = $derived(data.user!);

	// Wero payment links from banking apps expire (Sparkasse: 30 days)
	// svelte-ignore state_referenced_locally
	let weroLink = $state(data.payment?.weroLink ?? '');
	// svelte-ignore state_referenced_locally
	let weroExpires = $state(data.payment?.weroLinkExpires ?? '');
	function linkChanged() {
		// a new link: assume the usual 30 days, the user can change or clear it
		if (weroLink.trim() && weroLink.trim() !== data.payment?.weroLink) weroExpires = addDays(data.today, 30);
	}
	const storedExpires = $derived(data.payment?.weroLink ? data.payment.weroLinkExpires : null);
	const linkExpired = $derived(!!storedExpires && storedExpires < data.today);
	const linkExpiresSoon = $derived(!!storedExpires && !linkExpired && storedExpires <= addDays(data.today, 5));
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

<div class="card">
	<h2>App</h2>
	<InstallButton />
</div>

<div class="card">
	<h2>Benachrichtigungen</h2>
	<p class="small muted">Z.B. wenn jemand eine Ausgabe einträgt, dir Geld überweist oder dich an eine Zahlung erinnert. Einzelne Gruppen kannst du in deren Einstellungen stummschalten.</p>
	<PushToggle />
</div>

<form method="POST" action="?/savePayment" class="card" use:enhance={() => async ({ update }) => update({ reset: false })}>
	<h2>So bekommst du Geld</h2>
	<p class="small muted">Wer dir in einer Gruppe etwas schuldet, sieht diese Angaben beim Ausgleichen – mit fertigem Betrag.</p>
	{#if form?.paymentError}<p class="error">{form.paymentError}</p>{/if}
	{#if form?.paymentSaved}<p class="positive">✔ Gespeichert</p>{/if}
	<div class="field">
		<label for="weroContact">Wero: E-Mail oder Handynummer</label>
		<input id="weroContact" name="weroContact" value={data.payment?.weroContact ?? ''} autocomplete="off" />
		<p class="hint">Die Adresse oder Nummer, mit der du bei Wero angemeldet bist. Läuft nie ab – damit kann dir jeder Geld schicken.</p>
	</div>
	<div class="field">
		<label for="weroLink">Wero: Zahlungslink (optional)</label>
		<input id="weroLink" name="weroLink" bind:value={weroLink} onchange={linkChanged} placeholder="https://…" inputmode="url" />
		{#if linkExpired}
			<p class="error small">Dein Link ist seit {formatDate(storedExpires!)} abgelaufen und wird nicht mehr angezeigt. Erstelle in deiner Banking-App einen neuen und füge ihn hier ein.</p>
		{:else if linkExpiresSoon}
			<p class="notice small">Dein Link läuft am {formatDate(storedExpires!)} ab.</p>
		{/if}
		<p class="hint">
			Banking-App → Wero → Geld anfordern → Link ohne festen Betrag erstellen und hier einfügen. Solche Links gelten meist nur
			30 Tage (z.B. Sparkasse); danach blendet Split ihn aus.
		</p>
	</div>
	{#if weroLink.trim()}
		<div class="field">
			<label for="weroLinkExpires">Link gültig bis</label>
			<input id="weroLinkExpires" name="weroLinkExpires" type="date" bind:value={weroExpires} />
			<p class="hint">Leer lassen, wenn der Link nicht abläuft.</p>
		</div>
	{/if}
	<div class="field">
		<label for="iban">IBAN (für GiroCode / Überweisung)</label>
		<input id="iban" name="iban" value={data.payment?.iban ?? ''} autocomplete="off" />
	</div>
	<div class="field">
		<label for="accountHolder">Kontoinhaber</label>
		<input id="accountHolder" name="accountHolder" value={data.payment?.accountHolder ?? ''} placeholder={user.name} />
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
		<p class="small muted">Wenn du ein Konto beim Login-Anbieter hast, kannst du es verknüpfen. Dann kannst du auch eigene Gruppen anlegen.</p>
		<a class="button full" href="/auth/oidc/login?next=/profil">{data.oidcLabel}</a>
	</div>
{/if}

<div class="card">
	<h2>Weiteres Gerät</h2>
	{#if form?.pairing}
		<p class="small">Mit dem anderen Gerät scannen – der Code gilt 10 Minuten und nur einmal.</p>
		<div class="center"><div class="qr">{@html form.pairing.qr}</div></div>
		<input readonly value={form.pairing.url} onfocus={(e) => e.currentTarget.select()} />
	{:else}
		<p class="small muted">Melde dich auf einem Tablet oder Laptop an, ohne Passwort: Code anzeigen, mit dem anderen Gerät scannen.</p>
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
