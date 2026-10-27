<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const s = $derived(data.group.settings);
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
		<label class="check"><input type="checkbox" name="simplifyDebts" checked={s.simplifyDebts} /> Schulden vereinfachen (möglichst wenige Überweisungen)</label>
		<p class="hint" style="margin: -0.2rem 0 0.5rem 1.6rem">Aus: Jeder zahlt direkt an die, die für ihn ausgelegt haben.</p>
		<label class="check"><input type="checkbox" name="membersCanAddPeople" checked={s.membersCanAddPeople} /> Alle Mitglieder dürfen Personen hinzufügen</label>
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
{:else}
	<div class="card small muted">Nur Gruppenadmins können die Einstellungen ändern.</div>
{/if}

<a class="button full" href="/gruppen/{data.group.id}/profile" style="margin-bottom: 1rem">🏷️ Ausgaben-Profile ({data.profiles.length})</a>

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
	{#if data.group.closedUntil}
		<p class="small">🔒 Abgeschlossen bis <strong>{data.group.closedUntil}</strong>. Ausgaben bis dahin ändern sich nicht mehr, auch wenn Personen oder Faktoren geändert werden.</p>
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
			<span class="grow">{people.get(l.personId ?? '') ?? 'Jemand'} {actions[l.action] ?? l.action}{#if l.data && typeof l.data === 'object' && 'title' in l.data}: {l.data.title}{/if}</span>
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
	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
</style>
