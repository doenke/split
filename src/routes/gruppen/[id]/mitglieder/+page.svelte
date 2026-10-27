<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { formatDate, today } from '$lib/format';

	let { data, form } = $props();
	const claimed = $derived(new Set(data.claimed));
	const hasExpenses = $derived(data.expenses.length > 0);

	let adding = $state(page.url.searchParams.has('neu'));
	let addMode = $state<'new' | 'known' | 'kasse'>('new');
	// fall back when the chosen source has nobody left to add
	$effect(() => {
		if ((addMode === 'kasse' && !data.myKassen.length) || (addMode === 'known' && !data.known.length)) addMode = 'new';
	});
	const canEdit = (personId: string) =>
		data.isAdmin ||
		personId === data.user?.id ||
		(data.kassenByPerson[personId] ?? []).some((k) => data.managedKassen.includes(k.id));
	let join = $state<'all' | 'today' | 'date'>('all');
	let editing = $state<string | null>(null);
	let copied = $state(false);

	const invite = $derived(form && 'invite' in form ? form.invite : null);

	async function share(url: string, name: string) {
		const text = name
			? `Hallo ${name}, hier ist dein Zugang zu „${data.group.name}“ in Split:`
			: `Macht mit bei „${data.group.name}“ in Split:`;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'Split', text, url });
				return;
			} catch {
				// cancelled – fall back to copy
			}
		}
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const factorLabel = (f: number) => String(f).replace('.', ',');
	const tagSuggestions = $derived([...new Set(['Kind', 'Erwachsen', ...data.members.flatMap((m) => m.tags), ...data.profiles.flatMap((p) => [...(p.rule.tagFilter?.require ?? []), ...(p.rule.tagFilter?.exclude ?? [])])])]);
</script>

<svelte:head><title>Mitglieder · {data.group.name}</title></svelte:head>

{#if page.url.searchParams.has('neu')}
	<div class="notice">
		🎉 Gruppe angelegt! Füge jetzt alle Mitreisenden hinzu – auch Kinder oder Personen ohne Smartphone.
		Wer selbst mitmachen soll, bekommt danach einen persönlichen Link.
	</div>
{/if}

{#if form && 'message' in form && form.message}<p class="error">{form.message}</p>{/if}

{#if invite}
	{@const m = data.members.find((x) => x.personId === invite.personId)}
	<div class="card invite">
		<h2>Zugangslink für {m?.name}</h2>
		<p class="small muted">
			Gültig bis {formatDate(invite.expiresAt.slice(0, 10))}, einmal verwendbar. Schicke ihn z.B. per Messenger
			oder lass den QR-Code scannen.
		</p>
		<div class="qr">{@html invite.qr}</div>
		<input readonly value={invite.url} onfocus={(e) => e.currentTarget.select()} />
		<button class="primary full" style="margin-top: 0.5rem" onclick={() => share(invite.url, m?.name ?? '')}>
			{copied ? '✔ Kopiert' : 'Link teilen'}
		</button>
	</div>
{/if}

{#if data.isAdmin}
	<details class="card" open={!!form && 'groupLinkCreated' in form}>
		<summary><strong>🔗 Einladungslink für die ganze Gruppe</strong></summary>
		<p class="small muted" style="margin-top: 0.5rem">
			Ein Link für alle, z.B. für den Gruppenchat: Wer ihn öffnet, wählt „Wer bist du?“ aus den noch nicht
			angemeldeten Personen oder trägt sich neu ein. Achtung: Jeder mit dem Link kann beitreten.
		</p>
		{#if data.groupLink}
			<div class="center"><div class="qr">{@html data.groupLink.qr}</div></div>
			<input readonly value={data.groupLink.url} onfocus={(e) => e.currentTarget.select()} />
			<p class="hint">Gültig bis {formatDate(data.groupLink.expiresAt.slice(0, 10))}.</p>
			<div class="row">
				<button class="primary grow" onclick={() => share(data.groupLink!.url, '')}>{copied ? '✔ Kopiert' : 'Link teilen'}</button>
				<form method="POST" action="?/revokeGroupLink" use:enhance><button class="danger">Deaktivieren</button></form>
			</div>
			<form method="POST" action="?/groupLink" use:enhance style="margin-top: 0.5rem"><button class="link small">Neuen Link erzeugen (alter wird ungültig)</button></form>
		{:else}
			<form method="POST" action="?/groupLink" use:enhance><button class="primary full">Gruppenlink erstellen</button></form>
		{/if}
	</details>
{/if}

<div class="row" style="justify-content: space-between">
	<h2>{data.members.length} Mitglieder</h2>
	{#if data.canAddPeople && !adding}
		<button class="primary" onclick={() => (adding = true)}>+ Person</button>
	{/if}
</div>

{#if adding}
	<form
		method="POST"
		action={addMode === 'kasse' ? '?/addKasse' : '?/add'}
		class="card"
		use:enhance={() =>
			async ({ result, update }) => {
				await update();
				if (result.type === 'success') join = 'all';
			}}
	>
		{#if data.known.length || data.myKassen.length}
			<div class="segmented" style="margin-bottom: 0.75rem">
				<button type="button" class:active={addMode === 'new'} onclick={() => (addMode = 'new')}>Neue Person</button>
				{#if data.known.length}
					<button type="button" class:active={addMode === 'known'} onclick={() => (addMode = 'known')}>Bekannte Person</button>
				{/if}
				{#if data.myKassen.length}
					<button type="button" class:active={addMode === 'kasse'} onclick={() => (addMode = 'kasse')}>Ganze Kasse</button>
				{/if}
			</div>
		{/if}
		{#if addMode === 'kasse'}
			<div class="field">
				<label for="kasseId">Kasse</label>
				<select id="kasseId" name="kasseId">
					{#each data.myKassen as k (k.id)}<option value={k.id}>{k.name} ({k.missing.join(', ')})</option>{/each}
				</select>
				<p class="hint">Alle fehlenden Mitglieder der Kasse kommen dazu und rechnen gemeinsam ab. Faktoren kannst du danach anpassen.</p>
			</div>
		{:else if addMode === 'new'}
			<div class="field">
				<label for="name">Name</label>
				<input id="name" name="name" placeholder="z.B. Lea" required autocomplete="off" />
			</div>
		{:else}
			<div class="field">
				<label for="personId">Person</label>
				<select id="personId" name="personId" required>
					{#each data.known as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
				</select>
				<p class="hint">Die Person ist sofort dabei und braucht keinen neuen Link.</p>
			</div>
		{/if}
		{#if addMode !== 'kasse'}
			<div class="field">
				<label for="factor">Faktor</label>
				<input id="factor" name="factor" value="1" inputmode="decimal" style="width: 6rem" />
				<p class="hint">Gewichtung bei „Alle“-Ausgaben, z.B. 0,5 für ein Kind oder 0 für ein Kleinkind.</p>
			</div>
			<div class="field">
				<span class="label">Merkmale</span>
				<TagInput suggestions={tagSuggestions} />
				<p class="hint">Profile wie „Alkohol“ nutzen Merkmale, z.B. werden Personen mit „Kind“ dort nicht beteiligt.</p>
			</div>
		{/if}
		{#if hasExpenses}
			<fieldset class="field">
				<legend>An bisherigen Ausgaben beteiligen?</legend>
				<label class="check"><input type="radio" name="join" value="all" bind:group={join} /> Ja, an allen „Alle“-Ausgaben</label>
				<label class="check"><input type="radio" name="join" value="today" bind:group={join} /> Erst ab heute</label>
				<label class="check"><input type="radio" name="join" value="date" bind:group={join} /> Ab Datum</label>
				{#if join === 'date'}<input type="date" name="from" value={today()} />{/if}
			</fieldset>
		{/if}
		<div class="row">
			<button class="primary grow">Hinzufügen</button>
			<button type="button" onclick={() => (adding = false)}>Fertig</button>
		</div>
	</form>
{/if}

<div class="list">
	{#each data.members as m (m.personId)}
		<div class="member" class:open={editing === m.personId}>
			<div class="row top">
				<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={38} />
				<div class="grow">
					<div class="ellipsis">
						<strong>{m.name}</strong>
						{#if m.personId === data.user?.id}<span class="badge">du</span>{/if}
						{#if m.role === 'admin'}<span class="badge">Admin</span>{/if}
						{#if m.doneAt}<span class="badge done" title="hat alles eingetragen">✔ fertig</span>{/if}
						{#each m.tags as t (t)}<span class="badge tagbadge">{t}</span>{/each}
					</div>
					<div class="small muted">
						{#if claimed.has(m.personId)}angemeldet{:else}ohne Login{/if}
						{#if m.factor !== 1}· Faktor {factorLabel(m.factor)}{/if}
						{#if m.participationFrom || m.participationTo}
							· {m.participationFrom ? formatDate(m.participationFrom, { day: 'numeric', month: 'short' }) : '…'}
							– {m.participationTo ? formatDate(m.participationTo, { day: 'numeric', month: 'short' }) : '…'}
						{/if}
						{#if !m.kassePersonal}· Kasse {m.kasseName}{/if}
					</div>
				</div>
				{#if canEdit(m.personId)}
					<button class="link" onclick={() => (editing = editing === m.personId ? null : m.personId)}>
						{editing === m.personId ? 'Schließen' : 'Bearbeiten'}
					</button>
				{/if}
			</div>

			{#if editing === m.personId}
				<form
					method="POST"
					action="?/update"
					class="edit"
					use:enhance={() =>
						async ({ result, update }) => {
							await update({ reset: false });
							if (result.type === 'success') editing = null;
						}}
				>
					<input type="hidden" name="personId" value={m.personId} />
					{#if data.isAdmin && !claimed.has(m.personId)}
						<div class="field">
							<label for="n-{m.personId}">Name</label>
							<input id="n-{m.personId}" name="name" value={m.name} />
						</div>
					{/if}
					<div class="row">
						<div class="field" style="width: 6rem">
							<label for="f-{m.personId}">Faktor</label>
							<input id="f-{m.personId}" name="factor" value={factorLabel(m.factor)} inputmode="decimal" />
						</div>
						<div class="field grow">
							<label for="from-{m.personId}">Dabei ab (Anreise)</label>
							<input id="from-{m.personId}" type="date" name="from" value={m.participationFrom ?? ''} />
						</div>
						<div class="field grow">
							<label for="to-{m.personId}">Dabei bis (Abreise)</label>
							<input id="to-{m.personId}" type="date" name="to" value={m.participationTo ?? ''} />
						</div>
					</div>
					<p class="hint" style="margin-top: -0.5rem">Leer = die ganze Zeit. Bei Aufteilung nach Nächten zählt der Abreisetag nicht mit, nach Tagen schon. Änderungen wirken sich auf alle „Alle“-Ausgaben aus.</p>
					<div class="field">
						<span class="label">Merkmale</span>
						<TagInput value={m.tags} suggestions={tagSuggestions} />
					</div>
					{#if (data.kassenByPerson[m.personId] ?? []).length}
						<div class="field">
							<label for="k-{m.personId}">Rechnet ab über</label>
							<select id="k-{m.personId}" name="kasseId">
								<option value="personal" selected={!!m.kassePersonal}>sich allein</option>
								{#each data.kassenByPerson[m.personId] as k (k.id)}
									<option value={k.id} selected={k.id === m.kasseId}>Kasse {k.name}</option>
								{/each}
							</select>
						</div>
					{/if}
					{#if data.isAdmin}
						<label class="check">
							<input type="checkbox" name="role" value="admin" checked={m.role === 'admin'} />
							Gruppenadmin
						</label>
						<input type="hidden" name="role" value="member" />
					{/if}
					<div class="row" style="margin-top: 0.5rem">
						<button class="primary grow">Speichern</button>
					</div>
				</form>
				<div class="row actions">
					{#if data.canAddPeople && m.personId !== data.user?.id}
						<form method="POST" action="?/invite" use:enhance>
							<input type="hidden" name="personId" value={m.personId} />
							<button>🔗 {claimed.has(m.personId) ? 'Neuen Zugangslink' : 'Zugangslink erstellen'}</button>
						</form>
					{/if}
					{#if data.isAdmin && m.personId !== data.user?.id}
						<form
							method="POST"
							action="?/remove"
							use:enhance={({ cancel }) => {
								if (!confirm(`${m.name} aus der Gruppe entfernen?`)) cancel();
							}}
						>
							<input type="hidden" name="personId" value={m.personId} />
							<button class="danger">Entfernen</button>
						</form>
					{/if}
				</div>
			{:else if data.canAddPeople && !claimed.has(m.personId)}
				<form method="POST" action="?/invite" use:enhance class="inline-invite">
					<input type="hidden" name="personId" value={m.personId} />
					<button class="link small">🔗 Zugangslink erstellen</button>
				</form>
			{/if}
		</div>
	{/each}
</div>

<style>
	.member {
		display: block !important;
	}
	.top {
		flex-wrap: nowrap;
	}
	.edit {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--border);
	}
	.actions {
		margin-top: 0.5rem;
	}
	.inline-invite {
		margin: 0.25rem 0 0 3.2rem;
	}
	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
	.done {
		background: var(--primary-soft);
		color: var(--positive);
	}
	.tagbadge {
		background: var(--primary-soft);
		color: var(--text);
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0 0 0.9rem;
	}
	legend {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
	.invite {
		text-align: center;
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
		width: 220px;
		height: 220px;
	}
</style>
