<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { queueExpense } from '$lib/offline';
	import { computeShares, effectiveFactor, presentUnits } from '$lib/core/split';
	import { amountToInput, convert, currencyDigits, formatAmount, parseAmount } from '$lib/core/currency';
	import type { Member, SplitRule } from '$lib/core/types';
	import type { ExpenseInput } from '$lib/expense-input';
	import { today } from '$lib/format';
	import Avatar from './Avatar.svelte';
	import ReceiptPicker from './ReceiptPicker.svelte';
	import { onMount } from 'svelte';
	import { receiptDifference, type ReceiptRecognition } from '$lib/receipt';

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
		groupPeriod = null,
		receiptRecognition = false,
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
		attachments?: { id: string; mime: string; ocr?: ReceiptRecognition | null }[];
		/** whether uploaded receipts are read automatically */
		receiptRecognition?: boolean;
		/** travel dates of the group, used as default stay period */
		groupPeriod?: { from: string | null; to: string | null } | null;
		/** receipts uploaded before the form opened (e.g. shared from another app) */
		initialAttachmentIds?: { id: string; mime: string; ocr?: ReceiptRecognition | null }[];
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

	// receipt recognition: fills the form and lets the user take out single items
	let receipt = $state<{ attachmentId: string; result: ReceiptRecognition; deselected: number[] } | null>(null);
	let reading = $state<string | null>(null);
	let readMessage = $state<string | null>(null);
	const DIFF = -1; // index of the "difference / not recognized" row

	function applyReceipt(attachmentId: string, r: ReceiptRecognition, fillForm: boolean) {
		if (r.error) {
			readMessage = r.error;
			return;
		}
		readMessage = null;
		if (fillForm) {
			if (!title.trim() && r.merchant) title = r.merchant;
			if (!amountText.trim() && r.total !== null) {
				if (r.currency) currency = r.currency;
				amountText = amountToInput(r.total, r.currency ?? currency);
			}
			if (r.date && !init) date = r.date;
			if (r.categoryId && !categoryId) categoryId = r.categoryId;
		}
		if (r.items.length) receipt = { attachmentId, result: r, deselected: r.deselected ?? [] };
	}

	async function recognize(file: { id: string; mime: string }) {
		if (!receiptRecognition || !navigator.onLine) return;
		if (!/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mime)) return;
		reading = file.id;
		readMessage = null;
		try {
			const res = await fetch(`/belege/${file.id}/erkennen`, { method: 'POST' });
			const data = await res.json();
			if (!res.ok) throw new Error(data.message ?? 'Der Bon konnte nicht gelesen werden.');
			applyReceipt(file.id, data, true);
		} catch (e) {
			readMessage = (e as Error).message;
		} finally {
			reading = null;
		}
	}

	onMount(() => {
		for (const a of [...attachments, ...initialAttachmentIds]) {
			if (a.ocr) applyReceipt(a.id, a.ocr, !init);
			else if (!init) recognize(a);
		}
	});

	const receiptRows = $derived(
		receipt
			? [
					...receipt.result.items.map((it, i) => ({ index: i, description: it.description, amount: it.amount })),
					...(receiptDifference(receipt.result) !== 0
						? [{ index: DIFF, description: 'Differenz / nicht erkannt (z.B. Pfand, Rundung)', amount: receiptDifference(receipt.result) }]
						: [])
				]
			: []
	);

	function toggleItem(index: number) {
		if (!receipt) return;
		receipt.deselected = receipt.deselected.includes(index)
			? receipt.deselected.filter((i) => i !== index)
			: [...receipt.deselected, index];
		const priv = receiptRows.filter((r) => receipt!.deselected.includes(r.index)).reduce((s, r) => s + r.amount, 0);
		showPrivate = priv > 0;
		privateText = priv > 0 ? amountToInput(priv, receipt.result.currency ?? currency) : '';
	}
	// one id per form: retries and offline sync never create duplicates
	const clientId =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

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
	// weighting: the members' factors (default) or everybody the same
	let equalWeights = $state(init?.equalWeights ?? initRule?.equalWeights ?? false);

	// quick split by tag: "nur Kinder", "nur Erwachsene" (= everyone without "Kind") or any other tag
	const KID = 'Kind';
	type TagChoice = { kind: 'require'; tag: string } | { kind: 'adults' };
	const initTag = ((): TagChoice | null => {
		if (initRule?.type !== 'all' || init?.profileId || initRule.factorOverrides) return null;
		const f = initRule.tagFilter;
		if (f?.require?.length === 1 && !f.exclude?.length) return { kind: 'require', tag: f.require[0] };
		if (f?.exclude?.length === 1 && f.exclude[0] === KID && !f.require?.length) return { kind: 'adults' };
		return null;
	})();
	let tagChoice = $state<TagChoice | null>(initTag);
	const sameTag = (a: TagChoice | null, b: TagChoice) =>
		!!a && a.kind === b.kind && (a.kind === 'adults' || a.tag === (b as { tag: string }).tag);
	function chooseTag(t: TagChoice) {
		if (sameTag(tagChoice, t)) {
			tagChoice = null;
			return;
		}
		tagChoice = t;
		profileId = null;
		mode = 'all';
	}
	const tagChips = $derived.by(() => {
		const active = members.filter((m) => !m.participationTo || m.participationTo >= date);
		const count = (fn: (tags: string[]) => boolean) => active.filter((m) => fn(m.tags)).length;
		const chips: { label: string; choice: TagChoice; count: number }[] = [
			{ label: 'Nur Kinder', choice: { kind: 'require', tag: KID }, count: count((t) => t.includes(KID)) },
			{ label: 'Nur Erwachsene', choice: { kind: 'adults' }, count: count((t) => !t.includes(KID)) }
		];
		const others = [...new Set(members.flatMap((m) => m.tags))].filter((t) => t !== KID).sort((a, b) => a.localeCompare(b, 'de'));
		for (const t of others) {
			const n = count((tags) => tags.includes(t));
			chips.push({ label: `Nur „${t}“`, choice: { kind: 'require', tag: t }, count: n });
		}
		return chips;
	});
	const profile = $derived(profiles.find((p) => p.id === profileId) ?? null);
	const factorOf = (m: PersonOption) =>
		equalWeights && mode !== 'individual'
			? 1
			: effectiveFactor({ personId: m.personId, factor: m.factor, tags: m.tags, kasseId: m.kasseId }, rule.factorOverrides);
	function chooseProfile(id: string) {
		profileId = id;
		tagChoice = null;
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
	let periodFrom = $state(init?.period?.from ?? groupPeriod?.from ?? date);
	// svelte-ignore state_referenced_locally
	let periodTo = $state(init?.period?.to ?? groupPeriod?.to ?? date);
	// accommodation is paid per night, most other things per day – until the user chooses
	let unitChosen = $state(Boolean(init?.period));
	let periodUnit = $state<'days' | 'nights'>(init?.period?.unit ?? 'nights');
	$effect(() => {
		if (!unitChosen) periodUnit = categoryId === 'accommodation' || categoryId === null ? 'nights' : 'days';
	});
	const unitsOf = (m: PersonOption) =>
		presentUnits(
			{ personId: m.personId, factor: m.factor, tags: m.tags, kasseId: m.kasseId, from: m.participationFrom ?? undefined, to: m.participationTo ?? undefined },
			{ from: periodFrom, to: periodTo, unit: periodUnit }
		);
	const unitLabel = (n: number) => (periodUnit === 'nights' ? (n === 1 ? '1 Nacht' : `${n} Nächte`) : n === 1 ? '1 Tag' : `${n} Tage`);
	const periodTotal = $derived(
		presentUnits({ personId: '', factor: 1, tags: [], kasseId: '' }, { from: periodFrom, to: periodTo, unit: periodUnit })
	);

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
		const r = baseRule();
		return equalWeights && r.type !== 'individual' ? { ...r, equalWeights: true } : r;
	});
	function baseRule(): SplitRule {
		if (profile) return profile.rule;
		if (tagChoice && mode === 'all') {
			return tagChoice.kind === 'adults'
				? { type: 'all', tagFilter: { exclude: [KID] } }
				: { type: 'all', tagFilter: { require: [tagChoice.tag] } };
		}
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
	}

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
			clientId: init ? undefined : clientId,
			equalWeights: equalWeights && rule.type !== 'individual',
			receiptSelection: receipt ? { attachmentId: receipt.attachmentId, deselected: receipt.deselected } : undefined,
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
	use:enhance={({ cancel }) => {
		// offline: keep the new expense on the device and send it later
		if (!init && !navigator.onLine) {
			cancel();
			queueExpense(groupId, JSON.parse(payload)).then(() => goto(`/gruppen/${groupId}?offline=1`));
			return;
		}
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
					{:else if rateError && typeof navigator !== 'undefined' && !navigator.onLine}
						<p class="hint">Offline – der Tageskurs wird bei der Übertragung ermittelt.</p>
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
			<ReceiptPicker
				{groupId}
				existing={[...attachments, ...initialAttachmentIds]}
				bind:ids={attachmentIds}
				{reading}
				onuploaded={(f) => recognize(f)}
			/>
			{#if reading}
				<p class="hint">📷 Bon wird gelesen …</p>
			{:else if readMessage}
				<p class="hint error">{readMessage}</p>
			{:else if receiptRecognition}
				<p class="hint">Fotografierte Bons werden automatisch ausgelesen (über Claude von Anthropic).</p>
			{/if}
		</div>

		{#if receipt && receiptRows.length}
			<div class="field receipt-items">
				<span class="label">Positionen auf dem Bon</span>
				<p class="hint" style="margin-top: 0">Abgewählte Positionen werden nicht geteilt – sie trägt {type === 'income' ? 'der Empfänger' : 'der Zahler'} selbst.</p>
				{#each receiptRows as r (r.index)}
					<label class="check item" class:off={receipt.deselected.includes(r.index)}>
						<input type="checkbox" checked={!receipt.deselected.includes(r.index)} onchange={() => toggleItem(r.index)} />
						<span class="grow">{r.description}</span>
						<span class="amount">{formatAmount(r.amount, receipt.result.currency ?? currency)}</span>
					</label>
				{/each}
				{#if receipt.deselected.length}
					<p class="hint"><strong>Gemeinsam: {formatAmount(amount - privateAmount, currency)}</strong> von {formatAmount(amount, currency)}</p>
				{/if}
			</div>
		{/if}

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
		<div class="segmented" style="margin-bottom: 0.6rem">
			{#each Object.entries(modeLabels) as [k, label] (k)}
				<button type="button" class:active={!profile && !tagChoice && mode === k} onclick={() => ((mode = k as Mode), (profileId = null), (tagChoice = null))}>{label}</button>
			{/each}
		</div>
		<div class="chips tags" style="margin-bottom: 0.75rem">
			<span class="small muted">Merkmal:</span>
			{#each tagChips as c (c.label)}
				<button
					type="button"
					class="chip tag"
					class:active={sameTag(tagChoice, c.choice)}
					disabled={c.count === 0}
					title={c.count === 0 ? 'Niemand in der Gruppe hat dieses Merkmal – vergib es bei den Mitgliedern.' : ''}
					onclick={() => chooseTag(c.choice)}
				>
					{c.label} <span class="muted">({c.count})</span>
				</button>
			{/each}
		</div>
		{#if profile || mode !== 'individual'}
			<div class="row weighting">
				<span class="small muted">Gewichtung:</span>
				<div class="segmented small-seg grow">
					<button type="button" class:active={!equalWeights} onclick={() => (equalWeights = false)}>Voreingestellte Faktoren</button>
					<button type="button" class:active={equalWeights} onclick={() => (equalWeights = true)}>Alle gleich</button>
				</div>
			</div>
		{/if}
		{#if tagChoice}
			<p class="hint" style="margin-top: -0.4rem">
				{tagChoice.kind === 'adults' ? 'Alle ohne das Merkmal „Kind“.' : `Alle mit dem Merkmal „${tagChoice.tag}“.`}
				Wer später dazukommt, wird automatisch richtig einsortiert.
			</p>
		{/if}

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
				{#if showPeriod}<span class="badge">{unitLabel(unitsOf(m))}</span>{/if}
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
				<button type="button" class:active={periodUnit === 'nights'} onclick={() => ((periodUnit = 'nights'), (unitChosen = true))}>Nächte zählen</button>
				<button type="button" class:active={periodUnit === 'days'} onclick={() => ((periodUnit = 'days'), (unitChosen = true))}>Tage zählen</button>
			</div>
			<p class="hint">
				{#if periodUnit === 'nights'}
					<strong>Nächte</strong> (z.B. Unterkunft): {unitLabel(periodTotal)} im Zeitraum. Der Abreisetag zählt nicht – wer vom 1. bis 5. da ist, zahlt 4 Nächte.
				{:else}
					<strong>Tage</strong> (z.B. Mietwagen, Skipass): {unitLabel(periodTotal)} im Zeitraum. An- und Abreisetag zählen beide – wer vom 1. bis 5. da ist, zahlt 5 Tage.
				{/if}
				Jeder zahlt Faktor × eigene {periodUnit === 'nights' ? 'Nächte' : 'Tage'}; die An- und Abreise stehen bei den Mitgliedern unter „Dabei ab/bis“.
			</p>
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
	.tags {
		align-items: center;
	}
	.weighting {
		flex-wrap: nowrap;
		margin-bottom: 0.75rem;
	}
	.chip.tag {
		padding: 0.2rem 0.7rem;
		min-height: 34px;
		font-size: 0.85rem;
	}
	.chip.tag:disabled {
		opacity: 0.45;
	}
	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
	.receipt-items {
		background: var(--surface-2);
		border-radius: 10px;
		padding: 0.6rem 0.75rem;
	}
	.item {
		font-size: 0.9rem;
		margin: 0.15rem 0;
	}
	.item.off span {
		text-decoration: line-through;
		color: var(--muted);
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
