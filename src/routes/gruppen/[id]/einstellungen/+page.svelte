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
		'profile.delete': 'hat ein Profil gelöscht'
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
			<p class="small">Gib zur Bestätigung den Namen der Gruppe ein: <strong>{data.group.name}</strong></p>
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
