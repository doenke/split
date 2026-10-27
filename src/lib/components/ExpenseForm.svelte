<script lang="ts">
	import { enhance } from '$app/forms';
	import { computeShares, effectiveFactor } from '$lib/core/split';
	import { amountToInput, convert, currencyDigits, formatAmount, parseAmount } from '$lib/core/currency';
	import type { Member, SplitRule } from '$lib/core/types';
	import type { ExpenseInput } from '$lib/expense-input';
	import { today } from '$lib/format';
	import Avatar from './Avatar.svelte';
	import ReceiptPicker from './ReceiptPicker.svelte';

	interface PersonOption {
		personId: string;
		name: string;
		color: string;
		avatarUrl: string | null;
		factor: number;
		tags: string[];
		participationFrom: string | null;
		participationTo: string | null;
		kasseId: string;
	}

	let {
		groupId,
		baseCurrency,
		members,
		categories,
		currencies,
		meId,
		profiles = [],
		attachments = [],
		initialAttachmentIds = [],
		initial = null,
		error = null
	}: {
		groupId: string;
		baseCurrency: string;
		members: PersonOption[];
		categories: { id: string; name: string; icon: string; hidden: boolean }[];
		currencies: string[];
		meId: string;
		profiles?: { id: string; name: string; icon: string; rule: SplitRule; defaultCategoryId: string | null }[];
		initial?: ExpenseInput | null;
		attachments?: { id: string; mime: string }[];
		/** receipts uploaded before the form opened (e.g. shared from another app) */
		initialAttachmentIds?: { id: string; mime: string }[];
		error?: string | null;
	} = $props();

	// svelte-ignore state_referenced_locally
	const init = initial;
	let type = $state<'expense' | 'income'>(init?.type ?? 'expense');
	let title = $state(init?.title ?? '');
	// svelte-ignore state_referenced_locally
	let currency = $state(init?.currency ?? baseCurrency);
	let amountText = $state(init ? amountToInput(init.amount, init.currency) : '');
	let date = $state(init?.date ?? today());
	let categoryId = $state<string | null>(init?.categoryId ?? null);
	let notes = $state(init?.notes ?? '');
	let attachmentIds = $state<string[]>([]);

	// payers
	let multiPayer = $state((init?.payers.length ?? 1) > 1);
	// svelte-ignore state_referenced_locally
	let payer = $state(init?.payers[0]?.personId ?? meId);
	let payerAmounts = $state<Record<string, string>>(
		Object.fromEntries((init?.payers ?? []).map((p) => [p.personId, amountToInput(p.amount, init!.currency)]))
	);

	// split
	type Mode = 'all' | 'all_except' | 'only' | 'individual';
	const initRule = init?.rule;
	let mode = $state<Mode>(initRule?.type ?? 'all');
	let profileId = $state<string | null>(init?.profileId ?? null);
	const profile = $derived(profiles.find((p) => p.id === profileId) ?? null);
	const factorOf = (m: PersonOption) =>
		effectiveFactor({ personId: m.personId, factor: m.factor, tags: m.tags, kasseId: m.kasseId }, rule.factorOverrides);
	function chooseProfile(id: string) {
		profileId = id;
		mode = 'all';
		const p = profiles.find((x) => x.id === id);
		if (p?.defaultCategoryId && !categoryId) categoryId = p.defaultCategoryId;
	}
	// svelte-ignore state_referenced_locally
	let selected = $state<Record<string, boolean>>(
		Object.fromEntries(
			members.map((m) => [
				m.personId,
				initRule?.type === 'all_except'
					? initRule.excluded.includes(m.personId)
					: initRule?.type === 'only'
						? initRule.included.includes(m.personId)
						: false
			])
		)
	);
	let indivMode = $state<'shares' | 'percent' | 'amounts'>(initRule?.type === 'individual' ? initRule.mode : 'shares');
	// svelte-ignore state_referenced_locally
	let indivValues = $state<Record<string, string>>(
		Object.fromEntries(
			members.map((m) => {
				if (initRule?.type !== 'individual') return [m.personId, ''];
				const v = initRule.values[m.personId];
				if (v === undefined) return [m.personId, ''];
				return [m.personId, initRule.mode === 'amounts' ? amountToInput(v, init!.currency) : String(v).replace('.', ',')];
			})
		)
	);

	let showPrivate = $state((init?.privateAmount ?? 0) > 0);
	let privateText = $state(init?.privateAmount ? amountToInput(init.privateAmount, init.currency) : '');

	let showPeriod = $state(Boolean(init?.period));
	// svelte-ignore state_referenced_locally
	let periodFrom = $state(init?.period?.from ?? date);
	// svelte-ignore state_referenced_locally
	let periodTo = $state(init?.period?.to ?? date);
	let periodUnit = $state<'days' | 'nights'>(init?.period?.unit ?? 'nights');

	// exchange rate
	let rateSource = $state<'auto' | 'manual' | 'charged'>(init?.rate.source ?? 'auto');
	let manualRate = $state(init?.rate.value ? String(init.rate.value).replace('.', ',') : '');
	// svelte-ignore state_referenced_locally
	let chargedText = $state(init?.rate.charged ? amountToInput(init.rate.charged, baseCurrency) : '');
	let autoRate = $state<{ rate: number; rateDate: string; provisional: boolean } | null>(null);
	let rateError = $state<string | null>(null);

	$effect(() => {
		const c = currency;
		const d = date;
		if (c === baseCurrency) return;
		rateError = null;
		fetch(`/gruppen/${groupId}/kurs?currency=${c}&date=${d}`)
			.then(async (r) => {
				if (!r.ok) throw new Error((await r.json()).message);
				autoRate = await r.json();
			})
			.catch((e) => {
				autoRate = null;
				rateError = e.message;
			});
	});

	const amount = $derived(parseAmount(amountText, currency) ?? 0);
	const privateAmount = $derived(showPrivate ? (parseAmount(privateText, currency) ?? 0) : 0);
	const parseNum = (s: string) => {
		const n = parseFloat(s.replace(',', '.'));
		return Number.isFinite(n) ? n : 0;
	};
	const rate = $derived.by(() => {
		if (currency === baseCurrency) return 1;
		if (rateSource === 'manual') return parseNum(manualRate) || null;
		if (rateSource === 'charged') {
			const charged = parseAmount(chargedText, baseCurrency);
			if (!charged || !amount) return null;
			return charged / 10 ** currencyDigits(baseCurrency) / (amount / 10 ** currencyDigits(currency));
		}
		return autoRate?.rate ?? null;
	});
	const baseAmount = $derived(rate ? convert(amount, currency, baseCurrency, rate) : null);

	const payerSum = $derived(
		Object.values(payerAmounts).reduce((s, v) => s + (parseAmount(v, currency) ?? 0), 0)
	);

	const rule = $derived.by((): SplitRule => {
		if (profile) return profile.rule;
		const ids = Object.keys(selected).filter((id) => selected[id]);
		switch (mode) {
			case 'all':
				return { type: 'all' };
			case 'all_except':
				return { type: 'all_except', excluded: ids };
			case 'only':
				return { type: 'only', included: ids };
			case 'individual': {
				const values: Record<string, number> = {};
				for (const [id, v] of Object.entries(indivValues)) {
					const n = indivMode === 'amounts' ? (parseAmount(v, currency) ?? 0) : parseNum(v);
					if (n > 0) values[id] = n;
				}
				return { type: 'individual', mode: indivMode, values };
			}
		}
	});

	const coreMembers = $derived(
		members.map(
			(m): Member => ({
				personId: m.personId,
				factor: m.factor,
				tags: m.tags,
				from: m.participationFrom ?? undefined,
				to: m.participationTo ?? undefined,
				kasseId: m.kasseId
			})
		)
	);

	const indivSum = $derived(
		Object.values(indivValues).reduce(
			(s, v) => s + (indivMode === 'amounts' ? (parseAmount(v, currency) ?? 0) : parseNum(v)),
			0
		)
	);

	const preview = $derived.by(() => {
		if (!amount) return null;
		try {
			const sharedOriginal = amount - privateAmount;
			const r: SplitRule = rule.type === 'individual' && rule.mode === 'amounts' ? { ...rule, mode: 'shares' } : rule;
			const shares = computeShares(
				{
					id: 'preview',
					date,
					baseAmount: amount,
					privateAmount,
					payers: [{ personId: payer, amount }],
					rule: r,
					period: showPeriod ? { from: periodFrom, to: periodTo, unit: periodUnit } : undefined
				},
				coreMembers
			);
			if (rule.type === 'individual' && rule.mode === 'amounts' && indivSum !== sharedOriginal) {
				return { error: `Noch ${formatAmount(sharedOriginal - indivSum, currency)} zu verteilen.` };
			}
			if (rule.type === 'individual' && rule.mode === 'percent' && Math.abs(indivSum - 100) > 0.01) {
				return { error: `Summe: ${indivSum.toLocaleString('de-DE')} % (muss 100 % sein)` };
			}
			return { shares };
		} catch (e) {
			return { error: (e as Error).message };
		}
	});

	const payload = $derived(
		JSON.stringify({
			type,
			title,
			amount,
			currency,
			date,
			payers: multiPayer
				? Object.entries(payerAmounts)
						.map(([personId, v]) => ({ personId, amount: parseAmount(v, currency) ?? 0 }))
						.filter((p) => p.amount > 0)
				: [{ personId: payer, amount }],
			categoryId,
			profileId,
			rule,
			privateAmount,
			rate: {
				source: rateSource,
				value: rateSource === 'manual' ? parseNum(manualRate) : undefined,
				charged: rateSource === 'charged' ? (parseAmount(chargedText, baseCurrency) ?? undefined) : undefined
			},
			period: showPeriod ? { from: periodFrom, to: periodTo, unit: periodUnit } : null,
			notes,
			attachmentIds: [...new Set([...attachmentIds, ...initialAttachmentIds.map((a) => a.id)])]
		} satisfies ExpenseInput)
	);

	const modeLabels: Record<Mode, string> = {
		all: 'Alle',
		all_except: 'Alle außer …',
		only: 'Nur …',
		individual: 'Individuell'
	};
	let submitting = $state(false);
</script>

<form
	method="POST"
	action="?/save"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<input type="hidden" name="payload" value={payload} />
	{#if error}<p class="error">{error}</p>{/if}

	<div class="card">
		<div class="segmented" style="margin-bottom: 0.9rem">
			<button type="button" class:active={type === 'expense'} onclick={() => (type = 'expense')}>Ausgabe</button>
			<button type="button" class:active={type === 'income'} onclick={() => (type = 'income')}>Einnahme / Erstattung</button>
		</div>

		<div class="field">
			<label for="title">Wofür?</label>
			<input id="title" bind:value={title} placeholder={type === 'income' ? 'z.B. Pfand zurück' : 'z.B. Abendessen'} required autocomplete="off" />
		</div>

		<div class="row">
			<div class="field grow">
				<label for="amount">Betrag</label>
				<input id="amount" bind:value={amountText} inputmode="decimal" placeholder="0,00" required autocomplete="off" />
			</div>
			<div class="field" style="width: 7rem">
				<label for="currency">Währung</label>
				<select id="currency" bind:value={currency}>
					{#each currencies as c (c)}<option value={c}>{c}</option>{/each}
				</select>
			</div>
		</div>

		{#if currency !== baseCurrency}
			<div class="field fx">
				<div class="segmented small-seg">
					<button type="button" class:active={rateSource === 'auto'} onclick={() => (rateSource = 'auto')}>Tageskurs</button>
					<button type="button" class:active={rateSource === 'charged'} onclick={() => (rateSource = 'charged')}>Abgebucht</button>
					<button type="button" class:active={rateSource === 'manual'} onclick={() => (rateSource = 'manual')}>Kurs</button>
				</div>
				{#if rateSource === 'auto'}
					{#if autoRate}
						<p class="hint">
							1 {currency} = {autoRate.rate.toLocaleString('de-DE', { maximumFractionDigits: 5 })} {baseCurrency}
							(EZB, {autoRate.rateDate}){#if autoRate.provisional} · <strong>vorläufig</strong>{/if}
						</p>
					{:else if rateError}
						<p class="hint error">{rateError}</p>
					{/if}
				{:else if rateSource === 'charged'}
					<input bind:value={chargedText} inputmode="decimal" placeholder="Tatsächlich abgebucht in {baseCurrency}" />
					<p class="hint">Am fairsten: der Betrag laut Kontoauszug, inklusive Gebühren.</p>
				{:else}
					<input bind:value={manualRate} inputmode="decimal" placeholder="1 {currency} = ? {baseCurrency}" />
				{/if}
				{#if baseAmount !== null && amount}
					<p class="hint">≈ <strong>{formatAmount(baseAmount, baseCurrency)}</strong></p>
				{/if}
			</div>
		{/if}

		<div class="field">
			<ReceiptPicker {groupId} existing={[...attachments, ...initialAttachmentIds]} bind:ids={attachmentIds} />
		</div>

		<div class="row">
			<div class="field grow">
				<label for="date">Datum</label>
				<input id="date" type="date" bind:value={date} required />
			</div>
			<div class="field grow">
				<label for="category">Kategorie</label>
				<select id="category" bind:value={categoryId}>
					<option value={null}>–</option>
					{#each categories.filter((c) => !c.hidden || c.id === categoryId) as c (c.id)}
						<option value={c.id}>{c.icon} {c.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="card">
		<div class="row" style="justify-content: space-between">
			<h2>{type === 'income' ? 'Erhalten von' : 'Bezahlt von'}</h2>
			<label class="check small"><input type="checkbox" bind:checked={multiPayer} /> mehrere</label>
		</div>
		{#if !multiPayer}
			<div class="chips">
				{#each members as m (m.personId)}
					<button type="button" class="chip" class:active={payer === m.personId} onclick={() => (payer = m.personId)}>
						<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={24} />
						{m.name}
					</button>
				{/each}
			</div>
		{:else}
			{#each members as m (m.personId)}
				<div class="person-row">
					<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={28} />
					<span class="grow">{m.name}</span>
					<input class="num" inputmode="decimal" placeholder="0,00" bind:value={payerAmounts[m.personId]} />
				</div>
			{/each}
			<p class="hint" class:error={payerSum !== amount}>
				Summe {formatAmount(payerSum, currency)} von {formatAmount(amount, currency)}
			</p>
		{/if}
	</div>

	<div class="card">
		<h2>{type === 'income' ? 'Gutgeschrieben für' : 'Aufgeteilt auf'}</h2>
		{#if profiles.length}
			<div class="chips" style="margin-bottom: 0.6rem">
				{#each profiles as p (p.id)}
					<button type="button" class="chip profile" class:active={profileId === p.id} onclick={() => (profileId === p.id ? (profileId = null) : chooseProfile(p.id))}>
						{p.icon} {p.name}
					</button>
				{/each}
			</div>
		{/if}
		<div class="segmented" style="margin-bottom: 0.75rem">
			{#each Object.entries(modeLabels) as [k, label] (k)}
				<button type="button" class:active={!profile && mode === k} onclick={() => ((mode = k as Mode), (profileId = null))}>{label}</button>
			{/each}
		</div>

		{#if profile}
			<p class="hint" style="margin-top: -0.4rem">Profil „{profile.name}“: Ändert sich das Profil oder kommen Personen dazu, wird die Ausgabe automatisch neu aufgeteilt.</p>
		{/if}
		{#if !profile && mode === 'individual'}
			<div class="segmented small-seg" style="margin-bottom: 0.5rem">
				<button type="button" class:active={indivMode === 'shares'} onclick={() => (indivMode = 'shares')}>Anteile</button>
				<button type="button" class:active={indivMode === 'percent'} onclick={() => (indivMode = 'percent')}>Prozent</button>
				<button type="button" class:active={indivMode === 'amounts'} onclick={() => (indivMode = 'amounts')}>Beträge</button>
			</div>
		{/if}

		{#each members as m (m.personId)}
			{@const share = preview && 'shares' in preview ? preview.shares?.get(m.personId) : undefined}
			<div class="person-row" class:dim={!share}>
				{#if !profile && (mode === 'all_except' || mode === 'only')}
					<input type="checkbox" bind:checked={selected[m.personId]} aria-label={m.name} />
				{/if}
				<Avatar name={m.name} color={m.color} url={m.avatarUrl} size={28} />
				<span class="grow">
					{m.name}
					{#if factorOf(m) !== 1 && (profile || mode !== 'individual')}<span class="badge">×{String(factorOf(m)).replace('.', ',')}</span>{/if}
					{#if mode === 'all_except' && selected[m.personId]}<span class="badge">ausgenommen</span>{/if}
				</span>
				{#if !profile && mode === 'individual'}
					<input
						class="num"
						inputmode="decimal"
						placeholder={indivMode === 'shares' ? '0' : indivMode === 'percent' ? '0 %' : '0,00'}
						bind:value={indivValues[m.personId]}
					/>
				{/if}
				<span class="amount share">{share ? formatAmount(share, currency) : '–'}</span>
			</div>
		{/each}
		{#if preview && 'error' in preview}<p class="hint error">{preview.error}</p>{/if}
		{#if mode === 'all' || mode === 'all_except'}
			<p class="hint">Personen, die später dazukommen, werden automatisch beteiligt (je nach Teilnahmezeitraum).</p>
		{/if}
	</div>

	<div class="card">
		<label class="check"><input type="checkbox" bind:checked={showPrivate} /> Privater Anteil (z.B. eigener Einkauf auf dem Bon)</label>
		{#if showPrivate}
			<input bind:value={privateText} inputmode="decimal" placeholder="0,00" />
			<p class="hint">Dieser Teil wird nicht geteilt; ihn trägt {type === 'income' ? 'der Empfänger' : 'der Zahler'} selbst.</p>
		{/if}

		<label class="check"><input type="checkbox" bind:checked={showPeriod} /> Nach Aufenthaltsdauer aufteilen (z.B. Unterkunft)</label>
		{#if showPeriod}
			<div class="row">
				<div class="field grow"><label for="pf">Von</label><input id="pf" type="date" bind:value={periodFrom} /></div>
				<div class="field grow"><label for="pt">Bis</label><input id="pt" type="date" bind:value={periodTo} /></div>
			</div>
			<div class="segmented small-seg">
				<button type="button" class:active={periodUnit === 'nights'} onclick={() => (periodUnit = 'nights')}>Nächte</button>
				<button type="button" class:active={periodUnit === 'days'} onclick={() => (periodUnit = 'days')}>Tage</button>
			</div>
			<p class="hint">Jeder zahlt nach Faktor × anwesende {periodUnit === 'nights' ? 'Nächte' : 'Tage'} (aus dem Teilnahmezeitraum der Mitglieder).</p>
		{/if}

		<div class="field" style="margin-top: 0.75rem">
			<label for="notes">Notiz</label>
			<textarea id="notes" rows="2" bind:value={notes}></textarea>
		</div>
	</div>

	<button class="primary full" disabled={submitting || !title || !amount || (preview !== null && 'error' in preview)}>
		Speichern
	</button>
</form>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.chip {
		border-radius: 999px;
		padding: 0.25rem 0.75rem 0.25rem 0.3rem;
		font-weight: 500;
		min-height: 40px;
	}
	.chip.profile {
		padding: 0.25rem 0.75rem;
	}
	.chip.active {
		border-color: var(--primary);
		background: var(--primary-soft);
		font-weight: 700;
	}
	.person-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--border);
	}
	.person-row:last-of-type {
		border-bottom: 0;
	}
	.person-row.dim .grow {
		color: var(--muted);
	}
	.num {
		width: 6.5rem;
		text-align: right;
	}
	.share {
		min-width: 5.5rem;
		text-align: right;
	}
	.small-seg button {
		min-height: 32px;
		font-size: 0.85rem;
	}
	.fx {
		background: var(--surface-2);
		border-radius: 10px;
		padding: 0.6rem;
	}
	.fx input {
		margin-top: 0.5rem;
	}
</style>
