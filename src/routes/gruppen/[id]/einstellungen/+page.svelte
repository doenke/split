<script lang="ts">
	import IconPicker from '$lib/components/IconPicker.svelte';
	import { enhance } from '$app/forms';
	import { phaseHints, phaseLabels, phaseOrder } from '$lib/core/phase';

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
		'group.reopen': 'hat die Endabrechnung aufgehoben',
		'group.archive': 'hat die Gruppe archiviert',
		'group.unarchive': 'hat die Gruppe aus dem Archiv geholt',
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
		if (l.action === 'group.archive' && d.auto) return 'hat die Gruppe archiviert (30 Tage nach „quitt“)';
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
		<label class="check"><input type="checkbox" name="confirmPayments" checked={s.confirmPayments ?? false} /> Empfänger bestätigen Zahlungen</label>
		<!-- unticked: only whoever entered an expense, and admins, may change it -->
		<label class="check"><input type="checkbox" name="editOthers" checked={s.editOthers === 'all'} /> Jeder darf alle Ausgaben bearbeiten</label>
		<label class="check"><input type="checkbox" name="quiet" checked={s.quiet ?? false} /> Hintergrundgruppe: keine E-Mails zu dieser Gruppe</label>
		<!-- the phase follows from what happens; only archiving (and reopening a statement) is done here -->
		<div class="field">
			<span class="label">Status</span>
			{@render phases(true)}
		</div>
		<button class="primary full">Speichern</button>
	</form>

{#if data.isAdmin}
	<form id="newcat" method="POST" action="?/addCategory" use:enhance></form>
{/if}
{:else}
	<div class="card small muted">
		Nur Gruppenadmins können die Einstellungen ändern.
	</div>
	<div class="card">
		<span class="label">Status</span>
		{@render phases(false)}
	</div>
{/if}

<!-- all phases, the current one marked; the buttons sit at the phase they change -->
{#snippet phases(admin: boolean)}
	{@const current = phaseOrder.indexOf(data.phase)}
	{@const final = data.phase === 'settled' || data.phase === 'square' || (data.phase === 'archived' && data.completion.final)}
	<ol class="phases">
		{#each phaseOrder as ph, i (ph)}
			<li class:done={i < current} class:current={i === current}>
				<div class="row">
					<span class="dot" aria-hidden="true"></span>
					<span class="grow">{phaseLabels[ph]}{#if i === current}<span class="small muted now">· jetzt</span>{/if}</span>
					{#if admin && ph === 'settled' && final && data.phase !== 'archived'}
						<button
							formaction="?/reopen"
							class="small"
							onclick={(e) => {
								if (!confirm('Endabrechnung aufheben? Die Anteile werden wieder neu berechnet, und alle müssen erneut abschließen.')) e.preventDefault();
							}}>Endabrechnung aufheben</button
						>
					{/if}
					{#if admin && ph === 'archived'}
						{#if data.phase === 'archived'}
							<button formaction="?/unarchive" class="small">Aus dem Archiv holen</button>
						{:else}
							<button formaction="?/archive" class="small">Jetzt archivieren</button>
						{/if}
					{/if}
				</div>
				{#if i === current}<p class="hint">{phaseHints[ph]}</p>{/if}
				{#if admin && ph === 'settled' && final && data.phase !== 'archived'}
					<p class="hint">„Endabrechnung aufheben“ führt zurück zum Abschließen – alle müssen dann erneut abschließen.</p>
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}



<form method="POST" action="?/toggleMute" class="card row" use:enhance>
	<span class="grow">{data.muted ? '🔕 Benachrichtigungen für diese Gruppe sind aus' : '🔔 Benachrichtigungen für diese Gruppe sind an'}</span>
	<button>{data.muted ? 'Einschalten' : 'Stummschalten'}</button>
</form>


{#if data.user?.isOidc}
	<a class="button full" href="/gruppen/neu?vorlage={data.group.id}" style="margin-bottom: 1rem">📋 Neue Gruppe mit dieser als Vorlage</a>
{/if}
<a class="button full" href="/gruppen/{data.group.id}/papierkorb" style="margin-bottom: 1rem">🗑️ Papierkorb</a>

<h2>Verlauf</h2>
<div class="list small">
	{#each data.log as l (l.id)}
		<div>
			<span class="grow">{l.personId ? (people.get(l.personId) ?? 'Jemand') : 'Split'} {describe(l)}</span>
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
	.phases {
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0;
	}
	.phases li {
		position: relative;
		padding: 0.3rem 0 0.3rem 0;
		color: var(--muted);
	}
	.phases li .row {
		align-items: center;
		gap: 0.6rem;
		min-height: 2rem;
	}
	/* a line connecting the dots */
	.phases li:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 0.4rem;
		top: 1.3rem;
		bottom: -0.3rem;
		width: 2px;
		background: var(--border);
	}
	.phases .dot {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		border: 2px solid var(--border);
		background: var(--surface);
		flex: none;
		position: relative;
		z-index: 1;
	}
	.phases li.done .dot {
		background: var(--border);
	}
	.phases li.current {
		color: var(--text);
		font-weight: 600;
	}
	.phases li.current .dot {
		border-color: var(--primary);
		background: var(--primary);
		box-shadow: 0 0 0 3px var(--primary-soft);
	}
	.phases .now {
		margin-left: 0.35rem;
		font-weight: normal;
	}
	.phases .hint {
		margin: 0.1rem 0 0.2rem 1.4rem;
		font-weight: normal;
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
