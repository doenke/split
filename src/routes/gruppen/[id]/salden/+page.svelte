<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import PayPanel from '$lib/components/PayPanel.svelte';
	import CompletionCard from '$lib/components/CompletionCard.svelte';
	import { amountToInput } from '$lib/core/currency';
	import { formatAmount, formatDate, today } from '$lib/format';

	let { data, form } = $props();
	const currency = $derived(data.group.baseCurrency);
	const people = $derived(new Map(data.members.map((m) => [m.personId, m])));
	const kasseName = (id: string) => data.kassen[id]?.name ?? '?';
	const kasseMembers = (id: string) => data.members.filter((m) => m.kasseId === id);
	const kassen = $derived(Object.values(data.balances.kassen).sort((a, b) => b.balance - a.balance));
	const maxAbs = $derived(Math.max(1, ...kassen.map((k) => Math.abs(k.balance))));

	let recording = $state<{ from: string; to: string; amount: string } | null>(null);
	// a payment of your own choice: cash handed over, a partial payment, …
	let free = $state<{ from: string; to: string; amount: string; date: string } | null>(null);
	const groupKassen = $derived(
		[...new Set(data.members.map((m) => m.kasseId))].map((id) => ({ id, name: kasseName(id) })).sort((a, b) => a.name.localeCompare(b.name, 'de'))
	);
	$effect(() => {
		// payer and receiver must differ
		if (free && free.to === free.from) free.to = groupKassen.find((k) => k.id !== free!.from)?.id ?? '';
	});
	function startFree() {
		const other = groupKassen.find((k) => k.id !== data.myKasseId);
		free = { from: data.myKasseId, to: other?.id ?? '', amount: '', date: today() };
	}
	let paying = $state<string | null>(null);
	const methodLabels: Record<string, string> = {
		cash: 'Bar',
		transfer: 'Überweisung',
		paypal: 'PayPal',
		wero: 'Wero',
		other: 'Sonstiges'
	};
</script>

<svelte:head><title>Salden · {data.group.name}</title></svelte:head>

{#if form?.message}<p class="error">{form.message}</p>{/if}

<CompletionCard
	completion={data.completion}
	members={data.members}
	meId={data.user!.id}
	myKasseId={data.myKasseId}
	kasseName={data.kassen[data.myKasseId]?.name ?? ''}
	groupId={data.group.id}
	isAdmin={data.isAdmin}
	draftCount={data.drafts.length}
/>

<h2>Salden</h2>
<div class="list">
	{#each kassen as k (k.kasseId)}
		{@const ms = kasseMembers(k.kasseId)}
		<div class="kasse">
			<div class="head">
				<div class="avatars">
					{#each ms.slice(0, 3) as m (m.personId)}
						<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={30} />
					{/each}
				</div>
				<div class="grow">
					<div class="ellipsis"><strong>{kasseName(k.kasseId)}</strong>{#if k.kasseId === data.myKasseId} <span class="badge">du</span>{/if}</div>
					<div class="small muted">bezahlt {formatAmount(k.paid, currency)} · verbraucht {formatAmount(k.consumed, currency)}</div>
					<div class="bar"><span class={k.balance >= 0 ? 'pos' : 'neg'} style:width="{(Math.abs(k.balance) / maxAbs) * 100}%"></span></div>
				</div>
				<div class="amount right {k.balance > 0 ? 'positive' : k.balance < 0 ? 'negative' : 'muted'}">
					{k.balance > 0 ? '+' : ''}{formatAmount(k.balance, currency)}
				</div>
			</div>
			<!-- a shared Kasse (family): who is in it and what each one paid and used -->
			{#if ms.length > 1}
				<div class="members">
					{#each ms as m (m.personId)}
						{@const p = data.balances.persons[m.personId]}
						<div class="member">
							<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={22} />
							<span class="grow ellipsis">{m.name}</span>
							<span class="small muted">bezahlt {formatAmount(p?.paid ?? 0, currency)} · Anteil {formatAmount(p?.consumed ?? 0, currency)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
{#if kassen.some((k) => kasseMembers(k.kasseId).length > 1)}
	<p class="hint" style="margin-top: -0.5rem">Wer in einer gemeinsamen Kasse ist, gleicht zusammen aus – der Saldo steht bei der Kasse.</p>
{/if}

<a href="/gruppen/{data.group.id}/kosten" class="button full" style="margin-bottom: 1rem">📊 Was hat es gekostet? Nach Kategorien</a>

<h2>{data.completion.final ? 'Endabrechnung: so wird ausgeglichen' : 'So wird ausgeglichen (vorläufig)'}</h2>
{#if data.transfers.length === 0}
	<div class="card">🎉 Alles ausgeglichen.</div>
{:else}
	<div class="list">
		{#each data.transfers as t (t.from + t.to)}
			<div class="transfer">
				<div class="grow">
					<strong>{kasseName(t.from)}</strong> → <strong>{kasseName(t.to)}</strong>
				</div>
				<span class="amount">{formatAmount(t.amount, currency)}</span>
				{#if t.to === data.myKasseId}
					<form method="POST" action="?/remind" use:enhance>
						<input type="hidden" name="from" value={t.from} />
						<button class="small-btn" title="Per Benachrichtigung erinnern">{form && 'reminded' in form && form.reminded === t.from ? '✔' : '🔔'}</button>
					</form>
				{/if}
				{#if t.from === data.myKasseId}
					<button class="small-btn primary" onclick={() => (paying = paying === t.from + '|' + t.to ? null : t.from + '|' + t.to)}>Bezahlen</button>
				{/if}
				<button
					class="small-btn"
					onclick={() => (recording = { from: t.from, to: t.to, amount: amountToInput(t.amount, currency) })}
				>
					Bezahlt
				</button>
			</div>
			{#if paying === t.from + '|' + t.to}
				<div class="paybox">
					<PayPanel options={data.paymentOptions[paying] as never} amount={t.amount} {currency} />
					<button class="full" style="margin-top: 0.6rem" onclick={() => ((paying = null), (recording = { from: t.from, to: t.to, amount: amountToInput(t.amount, currency) }))}>
						Erledigt – Zahlung eintragen
					</button>
				</div>
			{/if}
			{#if recording && recording.from === t.from && recording.to === t.to}
				<form
					method="POST"
					action="?/record"
					class="record"
					use:enhance={() =>
						async ({ update }) => {
							await update();
							recording = null;
						}}
				>
					<input type="hidden" name="from" value={recording.from} />
					<input type="hidden" name="to" value={recording.to} />
					<label for="rec-amount" class="small">Gezahlter Betrag – auch ein Teilbetrag ist möglich</label>
					<div class="row">
						<input id="rec-amount" name="amount" bind:value={recording.amount} inputmode="decimal" class="grow" />
						<select name="method" class="grow">
							{#each Object.entries(methodLabels) as [k, label] (k)}<option value={k}>{label}</option>{/each}
						</select>
					</div>
					<div class="row" style="margin-top: 0.5rem">
						<button class="primary grow">Zahlung eintragen</button>
						<button type="button" onclick={() => (recording = null)}>Abbrechen</button>
					</div>
					<p class="hint">
						{data.myKasseId === recording.to ? 'Du bist Empfänger – die Zahlung gilt sofort als bestätigt.' : 'Der Empfänger bestätigt den Eingang.'}
					</p>
				</form>
			{/if}
		{/each}
	</div>
{/if}

{#if groupKassen.length > 1}
	{#if free}
		<form
			method="POST"
			action="?/record"
			class="card"
			use:enhance={() =>
				async ({ result, update }) => {
					await update();
					if (result.type === 'success') free = null;
				}}
		>
			<h2 style="margin-top: 0">Zahlung eintragen</h2>
			<div class="row">
				<div class="field grow">
					<label for="free-from">Von</label>
					<select id="free-from" name="from" bind:value={free.from}>
						{#each groupKassen as k (k.id)}<option value={k.id}>{k.name}{k.id === data.myKasseId ? ' (du)' : ''}</option>{/each}
					</select>
				</div>
				<div class="field grow">
					<label for="free-to">An</label>
					<select id="free-to" name="to" bind:value={free.to}>
						{#each groupKassen.filter((k) => k.id !== free?.from) as k (k.id)}<option value={k.id}>{k.name}{k.id === data.myKasseId ? ' (du)' : ''}</option>{/each}
					</select>
				</div>
			</div>
			<div class="row">
				<div class="field grow">
					<label for="free-amount">Betrag ({currency})</label>
					<input id="free-amount" name="amount" bind:value={free.amount} inputmode="decimal" placeholder="0,00" required />
				</div>
				<div class="field grow">
					<label for="free-method">Art</label>
					<select id="free-method" name="method">
						{#each Object.entries(methodLabels) as [k, label] (k)}<option value={k} selected={k === 'cash'}>{label}</option>{/each}
					</select>
				</div>
			</div>
			<div class="field">
				<label for="free-date">Datum</label>
				<input id="free-date" name="date" type="date" bind:value={free.date} max={today()} />
			</div>
			<p class="hint">
				Z.B. Bargeld, das du jemandem gegeben hast, oder ein Teil dessen, was du schuldest. Die Zahlung wird mit den Salden
				verrechnet. {free.to === data.myKasseId ? 'Du bist Empfänger – sie gilt sofort als bestätigt.' : 'Der Empfänger bestätigt den Eingang.'}
			</p>
			<div class="row">
				<button class="primary grow">Zahlung eintragen</button>
				<button type="button" onclick={() => (free = null)}>Abbrechen</button>
			</div>
		</form>
	{:else}
		<button class="full" style="margin-bottom: 1rem" onclick={startFree}>+ Zahlung eintragen (z.B. Bargeld, Teilzahlung)</button>
	{/if}
{/if}

{#if data.settlements.length}
	<h2>Zahlungen</h2>
	<div class="list">
		{#each data.settlements as s (s.id)}
			<div>
				<div class="grow">
					<div><strong>{kasseName(s.fromKasseId)}</strong> → <strong>{kasseName(s.toKasseId)}</strong></div>
					<div class="small muted">
						{formatDate(s.date)} · {methodLabels[s.method]} ·
						{#if s.status === 'confirmed'}<span class="positive">bestätigt</span>{:else}wartet auf Bestätigung{/if}
						· eingetragen von {people.get(s.createdBy)?.name ?? '?'}
					</div>
				</div>
				<span class="amount">{formatAmount(s.amount, currency)}</span>
				{#if s.status === 'pending' && (s.toKasseId === data.myKasseId || data.isAdmin)}
					<form method="POST" action="?/confirm" use:enhance>
						<input type="hidden" name="id" value={s.id} />
						<button class="small-btn primary">Erhalten</button>
					</form>
				{/if}
				{#if [s.fromKasseId, s.toKasseId].includes(data.myKasseId) || data.isAdmin}
					<form
						method="POST"
						action="?/delete"
						use:enhance={({ cancel }) => {
							if (!confirm('Zahlung löschen?')) cancel();
						}}
					>
						<input type="hidden" name="id" value={s.id} />
						<button class="link danger" aria-label="Löschen">✕</button>
					</form>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.kasse {
		display: block !important;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.members {
		margin: 0.5rem 0 0 calc(30px + 0.75rem);
		padding-left: 0.6rem;
		border-left: 2px solid var(--border);
	}
	.member {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.2rem 0;
	}
	.member .small {
		white-space: nowrap;
	}
	.avatars {
		display: flex;
	}
	.avatars :global(> * + *) {
		margin-left: -10px;
		box-shadow: 0 0 0 2px var(--surface);
	}
	.bar {
		height: 5px;
		background: var(--surface-2);
		border-radius: 3px;
		margin-top: 0.35rem;
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		border-radius: 3px;
	}
	.bar .pos {
		background: var(--positive);
	}
	.bar .neg {
		background: var(--negative);
	}
	.small-btn {
		min-height: 36px;
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
	}
	.paybox {
		display: block !important;
		background: var(--surface-2);
	}
	.record {
		display: block !important;
		background: var(--surface-2);
	}
</style>
