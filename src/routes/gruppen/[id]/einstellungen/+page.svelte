<script lang="ts">
	import IconPicker from '$lib/components/IconPicker.svelte';
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/format';

	let { data, form } = $props();
	const s = $derived(data.group.settings);
	// svelte-ignore state_referenced_locally
	let altCurrencies = $state<string[]>([...data.altCurrencies]);
	const currencyNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['de'], { type: 'currency' }) : null;
	const currencyName = (c: string) => currencyNames?.of(c) ?? '';
	// svelte-ignore state_referenced_locally
	let offeredCats = $state<string[]>(data.categories.filter((c) => c.offered).map((c) => c.id));
	$effect(() => {
		// a category added just now is offered too
		const added = data.categories.filter((c) => c.offered && !offeredCats.includes(c.id) && c.groupId);
		if (added.length && form && 'categoryAdded' in form) offeredCats = [...offeredCats, ...added.map((c) => c.id)];
	});
	const people = $derived(new Map(data.members.map((m) => [m.personId, m.name])));
	const actions: Record<string, string> = {
		'group.create': 'hat die Gruppe angelegt',
		'group.update': 'hat die Einstellungen geändert',
		'member.add': 'hat eine Person hinzugefügt',
		'member.update': 'hat ein Mitglied bearbeitet',
		'member.remove': 'hat eine Person entfernt',
		'expense.create': 'hat eine Ausgabe eingetragen',
		'expense.update': 'hat eine Ausgabe geändert',
		'expense.delete': 'hat eine Ausgabe gelöscht',
		'settlement.create': 'hat eine Zahlung eingetragen',
		'settlement.confirm': 'hat eine Zahlung bestätigt',
		'settlement.delete': 'hat eine Zahlung gelöscht',
		'profile.save': 'hat ein Profil gespeichert',
		'profile.delete': 'hat ein Profil gelöscht',
		'expense.restore': 'hat eine Ausgabe wiederhergestellt',
		'settlement.restore': 'hat eine Zahlung wiederhergestellt',
		'group.restore': 'hat die Gruppe wiederhergestellt',
		'group.link': 'hat einen Gruppenlink erstellt',
		'group.close': 'hat die Abrechnung abgeschlossen',
		'group.reopen': 'hat die Abrechnung wieder geöffnet',
		'settlement.remind': 'hat an eine Zahlung erinnert',
		'member.done': 'hat abgeschlossen',
		'member.undone': 'trägt doch noch etwas ein',
		'group.final': 'hat als Letzte(r) abgeschlossen – die Endabrechnung steht'
	};
	/** what happened – "Sönke hat Stefan abgeschlossen" when someone reports for others */
	function describe(l: (typeof data.log)[number]) {
		const d = (l.data && typeof l.data === 'object' ? l.data : {}) as Record<string, unknown>;
		if (l.action === 'member.done' || l.action === 'member.undone') {
			const done = l.action === 'member.done';
			const other = d.scope === 'person' && l.entityId && l.entityId !== l.personId ? (people.get(l.entityId) ?? 'jemanden') : null;
			if (other) return done ? `hat ${other} abgeschlossen` : `hat den Abschluss von ${other} zurückgenommen`;
			if (d.scope === 'all') return done ? 'hat alle abgeschlossen' : 'hat den Abschluss für alle zurückgenommen';
			if (d.scope === 'kasse') return done ? 'hat für die ganze Kasse abgeschlossen' : 'trägt für die Kasse doch noch etwas ein';
		}
		return (actions[l.action] ?? l.action) + ('title' in d && d.title ? `: ${d.title}` : '');
	}
</script>

<svelte:head><title>Einstellungen · {data.group.name}</title></svelte:head>

{#if form?.message}<p class="error">{form.message}</p>{/if}
{#if form?.saved}<p class="positive">✔ Gespeichert</p>{/if}

{#if data.isAdmin}
	<form method="POST" action="?/save" class="card" use:enhance={() => async ({ update }) => update({ reset: false })}>
		<div class="row">
			<div class="field" style="width: 4.5rem">
				<label for="emoji">Symbol</label>
				<input id="emoji" name="emoji" value={data.group.emoji} maxlength="4" />
			</div>
			<div class="field grow">
				<label for="name">Name</label>
				<input id="name" name="name" value={data.group.name} required />
			</div>
		</div>
		<div class="row">
			<div class="field grow">
				<label for="startDate">Von</label>
				<input id="startDate" type="date" name="startDate" value={data.group.startDate ?? ''} />
			</div>
			<div class="field grow">
				<label for="endDate">Bis</label>
				<input id="endDate" type="date" name="endDate" value={data.group.endDate ?? ''} />
			</div>
		</div>
		<div class="field">
			<span class="label">Währung</span>
			<div>{data.group.baseCurrency}</div>
		</div>
		<div class="field">
			<span class="label">Kategorien beim Erfassen</span>
			<div class="curs">
				{#each data.categories as c (c.id)}
					<label class="cur" class:on={offeredCats.includes(c.id)}><input type="checkbox" name="category" value={c.id} bind:group={offeredCats} />{c.icon} {c.name}</label>
				{/each}
			</div>
			<!-- belongs to the separate form "newcat" (forms cannot be nested) -->
			<div class="row newcat">
				<IconPicker name="icon" value="🏷️" form="newcat" />
				<input name="name" form="newcat" placeholder="Eigene Kategorie, z.B. Skipass" class="grow" style="width: auto" required aria-label="Name der Kategorie" />
				<button form="newcat">Hinzufügen</button>
			</div>
		</div>
		<details class="field currencies">
			<summary>
				<span class="label" style="display: inline">Weitere Währungen beim Erfassen:</span>
				<span class="muted">{altCurrencies.length ? altCurrencies.join(', ') : 'keine'}</span>
			</summary>
			<div class="curlist">
				{#each data.selectableCurrencies as c (c)}
					<label class="check"><input type="checkbox" name="currency" value={c} bind:group={altCurrencies} /> <strong>{c}</strong> <span class="muted">{currencyName(c)}</span></label>
				{/each}
			</div>
		</details>
		<label class="check"><input type="checkbox" name="simplifyDebts" checked={s.simplifyDebts} /> Schulden vereinfachen (möglichst wenige Überweisungen)</label>
		<label class="check"><input type="checkbox" name="membersCanAddPeople" checked={s.membersCanAddPeople} /> Alle Mitglieder dürfen Personen hinzufügen</label>
		<label class="check"><input type="checkbox" name="quiet" checked={s.quiet ?? false} /> Hintergrundgruppe: keine E-Mails zu dieser Gruppe</label>
		<div class="field" style="margin-top: 0.5rem">
			<label for="editOthers">Ausgaben anderer bearbeiten dürfen</label>
			<select id="editOthers" name="editOthers">
				<option value="all" selected={s.editOthers === 'all'}>alle Mitglieder</option>
				<option value="admins" selected={s.editOthers === 'admins'}>nur Ersteller und Admins</option>
			</select>
		</div>
		<div class="field">
			<label for="status">Status</label>
			<select id="status" name="status">
				<option value="active" selected={data.group.status === 'active'}>aktiv</option>
				<option value="settled" selected={data.group.status === 'settled'}>abgerechnet</option>
				<option value="archived" selected={data.group.status === 'archived'}>archiviert</option>
			</select>
		</div>
		<button class="primary full">Speichern</button>
	</form>

{#if data.isAdmin}
	<form id="newcat" method="POST" action="?/addCategory" use:enhance></form>
{/if}
{:else}
	<div class="card small muted">Nur Gruppenadmins können die Einstellungen ändern.</div>
{/if}


<form method="POST" action="?/toggleMute" class="card row" use:enhance>
	<span class="grow">{data.muted ? '🔕 Benachrichtigungen für diese Gruppe sind aus' : '🔔 Benachrichtigungen für diese Gruppe sind an'}</span>
	<button>{data.muted ? 'Einschalten' : 'Stummschalten'}</button>
</form>

<div class="card">
	<h2>Abrechnung & Export</h2>
	<div class="row" style="margin-bottom: 0.75rem">
		<a class="button grow" href="/gruppen/{data.group.id}/abrechnung">📄 Abrechnung (PDF)</a>
		<a class="button grow" href="/gruppen/{data.group.id}/export.csv" download>📊 CSV</a>
	</div>
	{#if data.completion.final}
		<p class="small">
			✅ Die Endabrechnung steht{data.completion.finalAt ? ` seit ${formatDate(data.completion.finalAt.slice(0, 10))}` : ''}. Die Anteile
			sind festgeschrieben und ändern sich nicht mehr, auch wenn Personen oder Faktoren geändert werden.
		</p>
		{#if data.isAdmin}
			<form method="POST" action="?/reopen" use:enhance={({ cancel }) => { if (!confirm('Endabrechnung wieder öffnen? Die Anteile werden dann wieder neu berechnet und alle müssen erneut abschließen.')) cancel(); }}>
				<button class="full">Wieder öffnen</button>
			</form>
		{/if}
	{:else if data.group.closedUntil}
		<p class="small">🔒 Ausgaben bis einschließlich <strong>{formatDate(data.group.closedUntil)}</strong> sind festgeschrieben und ändern sich nicht mehr, auch wenn Personen oder Faktoren geändert werden.</p>
		{#if data.isAdmin}
			<form method="POST" action="?/reopen" use:enhance={({ cancel }) => { if (!confirm('Abrechnung wieder öffnen? Die Anteile werden dann wieder neu berechnet und alle müssen erneut abschließen.')) cancel(); }}>
				<button class="full">Wieder öffnen</button>
			</form>
		{/if}
	{:else if data.isAdmin}
		<form method="POST" action="?/close" use:enhance>
			<p class="small muted">Schreibt die Anteile aller Ausgaben bis zum Stichtag fest – z.B. nach der Reise, bevor ausgeglichen wird.</p>
			<div class="row">
				<input type="date" name="until" value={data.group.endDate ?? new Date().toISOString().slice(0, 10)} class="grow" style="width: auto" />
				<button>Abschließen</button>
			</div>
		</form>
	{/if}
	{#if form && 'failed' in form && form.failed?.length}<p class="error small">Nicht aufteilbar und daher nicht festgeschrieben: {form.failed.join(', ')}</p>{/if}
</div>

{#if data.user?.isOidc}
	<a class="button full" href="/gruppen/neu?vorlage={data.group.id}" style="margin-bottom: 1rem">📋 Neue Gruppe mit dieser als Vorlage</a>
{/if}
<a class="button full" href="/gruppen/{data.group.id}/papierkorb" style="margin-bottom: 1rem">🗑️ Papierkorb</a>

<h2>Verlauf</h2>
<div class="list small">
	{#each data.log as l (l.id)}
		<div>
			<span class="grow">{people.get(l.personId ?? '') ?? 'Jemand'} {describe(l)}</span>
			<span class="muted">{new Date(l.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</span>
		</div>
	{/each}
</div>

{#if data.isAdmin}
	<details class="card">
		<summary class="negative">Gruppe löschen</summary>
		<form method="POST" action="?/delete" style="margin-top: 0.75rem">
			<p class="small">Die Gruppe kommt für 30 Tage in den Papierkorb (wiederherstellbar über „Meine Gruppen“). Gib zur Bestätigung den Namen der Gruppe ein: <strong>{data.group.name}</strong></p>
			<input name="confirm" autocomplete="off" />
			<button class="danger full" style="margin-top: 0.5rem">Endgültig löschen</button>
		</form>
	</details>
{/if}

<style>
	.newcat {
		align-items: center;
		margin-top: 0.5rem;
	}
	.currencies summary {
		cursor: pointer;
	}
	.curlist {
		max-height: 16rem;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.25rem 0.6rem;
		margin-top: 0.4rem;
	}
	.curlist .check {
		margin: 0.3rem 0;
	}
	.curs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.cur {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.85rem;
		cursor: pointer;
		margin: 0;
	}
	.cur input {
		display: none;
	}
	.cur.on {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-text);
	}
	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
</style>
