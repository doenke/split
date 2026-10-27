<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import ExpenseForm from '$lib/components/ExpenseForm.svelte';
	import { formatAmount, formatDate } from '$lib/format';

	let { data, form } = $props();
	let editing = $state(false);
	$effect(() => {
		if (form?.message) editing = true;
	});

	const e = $derived(data.expense);
	const base = $derived(data.group.baseCurrency);
	const people = $derived(new Map(data.members.map((m) => [m.personId, m])));
	const cat = $derived(data.categories.find((c) => c.id === e.categoryId));
	const shareRows = $derived(
		Object.entries(data.shares)
			.filter(([, v]) => v !== 0)
			.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
	);
	const ruleText = $derived.by(() => {
		const r = e.rule;
		const prof = data.profiles.find((p) => p.id === e.profileId);
		if (!r && prof) return `${prof.icon} ${prof.name}`;
		if (!r || r.type === 'all') return 'Alle';
		const names = (ids: string[]) => ids.map((id) => people.get(id)?.name ?? '?').join(', ');
		if (r.type === 'all_except') return `Alle außer ${names(r.excluded)}`;
		if (r.type === 'only') return `Nur ${names(r.included)}`;
		return { shares: 'Individuell nach Anteilen', percent: 'Individuell in Prozent', amounts: 'Individuelle Beträge' }[r.mode];
	});
	const actionLabels: Record<string, string> = {
		'expense.create': 'angelegt',
		'expense.update': 'geändert',
		'expense.delete': 'gelöscht'
	};
</script>

<svelte:head><title>{e.title} · {data.group.name}</title></svelte:head>

<a href="/gruppen/{data.group.id}" class="small">← Zurück</a>

{#if editing}
	<h2 style="margin-top: 0.75rem">Ausgabe bearbeiten</h2>
	<ExpenseForm
		groupId={data.group.id}
		baseCurrency={base}
		members={data.members}
		categories={data.categories}
		profiles={data.profiles}
		currencies={data.currencies}
		meId={data.user!.id}
		initial={data.initial}
		error={form?.message}
	/>
	<button class="full" style="margin-top: 0.5rem" onclick={() => (editing = false)}>Abbrechen</button>
{:else}
	<div class="card" style="margin-top: 0.75rem">
		<div class="row" style="justify-content: space-between; align-items: flex-start">
			<div>
				<div class="small muted">{cat ? `${cat.icon} ${cat.name}` : 'Ohne Kategorie'} · {formatDate(e.date)}</div>
				<h1 style="margin: 0.2rem 0">{e.title}</h1>
			</div>
			<div class="right">
				<div class="amount big" class:positive={e.type === 'income'}>{formatAmount(e.amount, e.currency)}</div>
				{#if e.currency !== base}
					<div class="small muted">≈ {formatAmount(e.baseAmount, base)}</div>
					<div class="small muted">
						Kurs {e.rate.toLocaleString('de-DE', { maximumFractionDigits: 5 })}
						({{ ecb: 'EZB', manual: 'manuell', charged: 'abgebucht', none: '' }[e.rateSource]}){#if e.rateProvisional}, vorläufig{/if}
					</div>
				{/if}
			</div>
		</div>
		{#if e.type === 'income'}<p class="badge">Einnahme / Erstattung</p>{/if}

		<h3 style="margin-top: 1rem">{e.type === 'income' ? 'Erhalten von' : 'Bezahlt von'}</h3>
		{#each e.payers as p (p.personId)}
			{@const m = people.get(p.personId)}
			<div class="row person">
				<Avatar name={m?.name ?? '?'} color={m?.color} url={m?.avatarUrl} size={28} />
				<span class="grow">{m?.name ?? 'Ehemaliges Mitglied'}</span>
				<span class="amount">{formatAmount(p.amount, e.currency)}</span>
			</div>
		{/each}
		{#if e.privateAmount > 0}
			<p class="small muted">davon privat (nicht geteilt): {formatAmount(e.privateAmount, base)}</p>
		{/if}

		<h3 style="margin-top: 1rem">Aufteilung: {ruleText}</h3>
		{#if e.periodFrom && e.periodTo}
			<p class="small muted">
				nach Aufenthalt, {formatDate(e.periodFrom)} – {formatDate(e.periodTo)} ({e.periodUnit === 'nights' ? 'Nächte' : 'Tage'})
			</p>
		{/if}
		{#each shareRows as [personId, amount] (personId)}
			{@const m = people.get(personId)}
			<div class="row person">
				<Avatar name={m?.name ?? '?'} color={m?.color} url={m?.avatarUrl} size={28} />
				<span class="grow">{m?.name ?? 'Ehemaliges Mitglied'}</span>
				<span class="amount">{formatAmount(Math.abs(amount), base)}</span>
			</div>
		{/each}

		{#if e.notes}
			<h3 style="margin-top: 1rem">Notiz</h3>
			<p style="white-space: pre-wrap">{e.notes}</p>
		{/if}
	</div>

	{#if data.canEdit}
		<div class="row">
			<button class="primary grow" onclick={() => (editing = true)}>Bearbeiten</button>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm('Ausgabe wirklich löschen?')) cancel();
				}}
			>
				<button class="danger">Löschen</button>
			</form>
		</div>
	{/if}

	{#if data.history.length}
		<div class="small muted" style="margin-top: 1rem">
			{#each data.history as h, i (i)}
				<div>
					{people.get(h.personId ?? '')?.name ?? 'Jemand'} hat die Ausgabe {actionLabels[h.action] ?? h.action}
					· {new Date(h.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
				</div>
			{/each}
		</div>
	{/if}
{/if}

<style>
	.big {
		font-size: 1.4rem;
	}
	.person {
		padding: 0.3rem 0;
	}
</style>
