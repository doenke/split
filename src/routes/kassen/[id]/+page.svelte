<script lang="ts">
	import NameFields from '$lib/components/NameFields.svelte';
	import KasseSwitchDialog from '$lib/components/KasseSwitchDialog.svelte';
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatAmount } from '$lib/format';
	import CostBars from '$lib/components/CostBars.svelte';

	let { data, form } = $props();
	let adding = $state(false);
	let addMode = $state<'new' | 'known'>('new');
	let netting = $state<string | null>(null);
	const me = $derived(data.members.find((m) => m.personId === data.user?.id));
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	const years = $derived([...new Set(data.costs.map((c) => c.year))].sort().reverse());
	let year = $state<string | null>(null);
	const costTotals = $derived.by(() => {
		const byCurrency = new Map<string, Record<string, number>>();
		for (const c of data.costs) {
			if (year && c.year !== year) continue;
			const t = byCurrency.get(c.currency) ?? {};
			for (const [cat, v] of Object.entries(c.totals)) t[cat] = (t[cat] ?? 0) + v;
			byCurrency.set(c.currency, t);
		}
		return [...byCurrency];
	});
	const methodLabels: Record<string, string> = { transfer: 'Überweisung', paypal: 'PayPal', wero: 'Wero', cash: 'Bar', other: 'Sonstiges' };
</script>

<svelte:head><title>{data.kasse.name} · Kassen</title></svelte:head>

<a href="/kassen" class="small">← Alle Kassen</a>

<KasseSwitchDialog switched={form && 'switched' in form ? form.switched : []} />
{#if form && 'message' in form && form.message}<p class="error">{form.message}</p>{/if}

{#if data.isManager}
	<form method="POST" action="?/rename" class="row title" use:enhance={keep}>
		<input name="name" value={data.kasse.name} class="grow name" aria-label="Name der Kasse" />
		<button>Speichern</button>
	</form>
{:else}
	<h1 class="title">{data.kasse.name}</h1>
{/if}

{#if data.totals.length}
	<div class="card row" style="justify-content: space-between">
		<span class="muted">Gesamtsaldo über alle Gruppen</span>
		<span>
			{#each data.totals as t (t.currency)}
				<div class="amount big right {t.amount > 0 ? 'positive' : t.amount < 0 ? 'negative' : ''}">
					{t.amount > 0 ? '+' : ''}{formatAmount(t.amount, t.currency)}
				</div>
			{/each}
		</span>
	</div>
{/if}

{#if data.netting.length}
	<h2>Über Gruppen verrechnen</h2>
	<p class="small muted">Statt mehrerer Zahlungen in verschiedenen Gruppen reicht eine einzige Zahlung.</p>
	<div class="list">
		{#each data.netting as n (n.kasseId + n.currency)}
			<div class="block">
				<div class="row">
					<div class="grow">
						{#if n.amount > 0}<strong>{n.name}</strong> zahlt euch{:else if n.amount < 0}Ihr zahlt an <strong>{n.name}</strong>{:else}Mit <strong>{n.name}</strong> ausgeglichen{/if}
						<div class="small muted">
							{#each n.parts as p, i (p.groupId)}{i ? ' · ' : ''}{data.groups.find((g) => g.id === p.groupId)?.name}: {p.amount > 0 ? '+' : ''}{formatAmount(p.amount, n.currency)}{/each}
						</div>
					</div>
					<span class="amount">{formatAmount(Math.abs(n.amount), n.currency)}</span>
					<button class="small-btn" onclick={() => (netting = netting === n.kasseId ? null : n.kasseId)}>Erledigt</button>
				</div>
				{#if netting === n.kasseId}
					<form method="POST" action="?/settleNet" class="row" style="margin-top: 0.5rem" use:enhance>
						<input type="hidden" name="kasseId" value={n.kasseId} />
						<input type="hidden" name="currency" value={n.currency} />
						<select name="method" class="grow">
							{#each Object.entries(methodLabels) as [k, label] (k)}<option value={k}>{label}</option>{/each}
						</select>
						<button class="primary">Verrechnung eintragen</button>
					</form>
					<p class="hint">Es wird in jeder Gruppe eine passende Zahlung eingetragen, die zusammen genau {formatAmount(Math.abs(n.amount), n.currency)} ergeben.</p>
				{/if}
			</div>
		{/each}
	</div>
{/if}
{#if form && 'settled' in form}<p class="positive">✔ Verrechnung eingetragen.</p>{/if}

<h2>Gruppen</h2>
{#if data.groups.length === 0}
	<div class="card small muted">
		Diese Kasse wird noch in keiner Gruppe verwendet. Ordne sie in einer Gruppe unter <em>Mitglieder → Bearbeiten</em> zu
		– oder füge neue Mitglieder hier hinzu, sie übernehmen die Kasse automatisch.
	</div>
{:else}
	<div class="list">
		{#each data.groups as g (g.id)}
			<a href="/gruppen/{g.id}/salden">
				<span class="emoji">{g.emoji}</span>
				<div class="grow">
					<strong>{g.name}</strong>
					<div class="small muted">bezahlt {formatAmount(g.paid, g.currency)} · verbraucht {formatAmount(g.consumed, g.currency)}</div>
				</div>
				<span class="amount {g.balance > 0 ? 'positive' : g.balance < 0 ? 'negative' : 'muted'}">
					{g.balance > 0 ? '+' : ''}{formatAmount(g.balance, g.currency)}
				</span>
			</a>
		{/each}
	</div>
{/if}

{#if data.costs.length}
	<h2>Was hat es euch gekostet?</h2>
	<div class="card">
		{#if years.length > 1}
			<div class="segmented" style="margin-bottom: 0.5rem">
				<button type="button" class:active={year === null} onclick={() => (year = null)}>Alle</button>
				{#each years as y (y)}<button type="button" class:active={year === y} onclick={() => (year = y)}>{y}</button>{/each}
			</div>
		{/if}
		{#each costTotals as [currency, totals] (currency)}
			<div class="row" style="justify-content: space-between">
				<span class="muted small">{data.costs.filter((c) => (!year || c.year === year) && c.currency === currency).length} Gruppe(n)</span>
				<span class="amount">{formatAmount(Object.values(totals).reduce((a, b) => a + b, 0), currency)}</span>
			</div>
			<CostBars {totals} categories={data.categories} {currency} />
		{/each}
	</div>
{/if}

<div class="row" style="justify-content: space-between">
	<h2>Mitglieder</h2>
	{#if data.isManager && !adding}<button class="primary" onclick={() => (adding = true)}>+ Person</button>{/if}
</div>

{#if adding}
	<form method="POST" action="?/addMember" class="card" use:enhance>
		{#if data.known.length}
			<div class="segmented" style="margin-bottom: 0.75rem">
				<button type="button" class:active={addMode === 'new'} onclick={() => (addMode = 'new')}>Neue Person</button>
				<button type="button" class:active={addMode === 'known'} onclick={() => (addMode = 'known')}>Bekannte Person</button>
			</div>
		{/if}
		{#if addMode === 'new'}
			<NameFields id="kasse-name" />
			<p class="hint">Z.B. ein Kind ohne eigenes Handy. Die Person kann später einen Zugangslink bekommen.</p>
		{:else}
			<select name="personId">
				{#each data.known as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
			</select>
		{/if}
		<p class="hint">Ist die Person in einer offenen Gruppe zusammen mit jemandem aus dieser Kasse, rechnet sie dort ab jetzt über die Kasse ab.</p>
		<div class="row" style="margin-top: 0.5rem">
			<button class="primary grow">Hinzufügen</button>
			<button type="button" onclick={() => (adding = false)}>Fertig</button>
		</div>
	</form>
{/if}

<div class="list">
	{#each data.members as m (m.personId)}
		<div>
			<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={34} />
			<div class="grow">
				<div>
					<strong>{m.name}</strong>
					{#if m.personId === data.user?.id}<span class="badge">du</span>{/if}
					{#if m.isManager}<span class="badge">Verwalter</span>{/if}
					{#if data.kasse.receiverPersonId === m.personId}<span class="badge">empfängt Zahlungen</span>{/if}
				</div>
				{#if data.isManager}
					<div class="row small actions">
						{#if data.kasse.receiverPersonId !== m.personId}
							<form method="POST" action="?/setReceiver" use:enhance><input type="hidden" name="personId" value={m.personId} /><button class="link">Zahlungsempfänger</button></form>
						{/if}
						<form method="POST" action="?/toggleManager" use:enhance><input type="hidden" name="personId" value={m.personId} /><button class="link">{m.isManager ? 'Kein Verwalter' : 'Verwalter'}</button></form>
						{#if m.personId !== data.user?.id}
							<form
								method="POST"
								action="?/removeMember"
								use:enhance={({ cancel }) => {
									if (!confirm(`${m.name} aus der Kasse entfernen? In den Gruppen rechnet die Person dann wieder für sich allein ab.`)) cancel();
								}}
							>
								<input type="hidden" name="personId" value={m.personId} /><button class="link danger">Entfernen</button>
							</form>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

{#if me}
	<div class="card stack">
		<form method="POST" action="?/setPreferred" use:enhance>
			<label class="check">
				<input type="checkbox" checked={me.isPreferred} onchange={(e) => e.currentTarget.form?.requestSubmit()} />
				Meine bevorzugte Kasse (wird in neuen Gruppen vorausgewählt)
			</label>
		</form>
		<form
			method="POST"
			action="?/removeMember"
			use:enhance={({ cancel }) => {
				if (!confirm('Kasse verlassen?')) cancel();
			}}
		>
			<input type="hidden" name="personId" value={me.personId} />
			<button class="danger full">Kasse verlassen</button>
		</form>
		{#if data.isManager && data.groups.length === 0}
			<form method="POST" action="?/delete" use:enhance={({ cancel }) => { if (!confirm('Kasse löschen?')) cancel(); }}>
				<button class="danger full">Kasse löschen</button>
			</form>
		{/if}
	</div>
{/if}

<style>
	.title {
		margin: 0.75rem 0 1rem;
	}
	.name {
		font-size: 1.3rem;
		font-weight: 700;
		width: auto;
	}
	.big {
		font-size: 1.3rem;
	}
	.emoji {
		font-size: 1.6rem;
	}
	.block {
		display: block !important;
	}
	.actions {
		gap: 0.9rem;
		margin-top: 0.2rem;
	}
	.small-btn {
		min-height: 36px;
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
	}
</style>
