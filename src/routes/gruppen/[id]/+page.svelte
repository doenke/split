<script lang="ts">
	import { uploadErrorMessage } from '$lib/upload-error';
	import { formatAmount, formatDate } from '$lib/format';
	import CompletionCard from '$lib/components/CompletionCard.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll, preloadData } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { shrinkToFile } from '$lib/image';
	import { today } from '$lib/format';
	import { discardPending, flushPending, pendingExpenses, type PendingExpense } from '$lib/offline';

	let { data, form } = $props();
	const base = $derived(`/gruppen/${data.group.id}`);
	const currency = $derived(data.group.baseCurrency);
	const people = $derived(new Map(data.members.map((m) => [m.personId, m])));
	const cats = $derived(new Map(data.categories.map((c) => [c.id, c])));
	const myKasse = $derived(data.balances.kassen[data.myKasseId]);
	const total = $derived(
		data.expenses.reduce((s, e) => s + (e.type === 'income' ? -1 : 1) * (e.baseAmount - e.privateAmount), 0)
	);

	let pending = $state<PendingExpense[]>([]);
	const loadPending = async () => (pending = await pendingExpenses(data.group.id));
	onMount(() => {
		loadPending();
		// keep the form available offline
		if (navigator.onLine) preloadData(`/gruppen/${data.group.id}/ausgaben/neu`).catch(() => {});
		window.addEventListener('split:pending', loadPending);
		return () => window.removeEventListener('split:pending', loadPending);
	});

	// camera button: photograph a receipt now, complete the expense later
	let snapping = $state(false);
	let snapMessage = $state<string | null>(null);
	async function snap(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		snapping = true;
		snapMessage = null;
		try {
			const body = new FormData();
			body.append('file', await shrinkToFile(file));
			body.append('date', today());
			const res = await fetch(`/gruppen/${data.group.id}/ausgaben/vorbereiten`, { method: 'POST', body });
			if (!res.ok) throw new Error(await uploadErrorMessage(res));
			snapMessage = '📷 Bon gespeichert – du findest ihn unter „Vorbereitet“.';
			await invalidateAll();
		} catch (err) {
			snapMessage = navigator.onLine ? (err as Error).message : 'Offline – bitte später erneut fotografieren.';
		} finally {
			snapping = false;
		}
	}
	const cur = (e: { amount: number; currency: string }) => formatAmount(e.amount, e.currency);
	// foreign-currency expenses whose charged amount the user still has to enter
	const awaiting = $derived(
		data.expenses.filter(
			(e) => e.awaitingCharge && !e.frozenShares && (e.createdBy === data.user?.id || e.payers.some((p) => p.personId === data.user?.id))
		)
	);

	let query = $state('');
	const filtered = $derived(
		query
			? data.expenses.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
			: data.expenses
	);
	const byDate = $derived.by(() => {
		const groups = new Map<string, typeof filtered>();
		for (const e of filtered) {
			if (!groups.has(e.date)) groups.set(e.date, []);
			groups.get(e.date)!.push(e);
		}
		return [...groups];
	});

	function payerText(e: (typeof data.expenses)[number]) {
		if (e.payers.length === 1) return people.get(e.payers[0].personId)?.name ?? '?';
		return `${e.payers.length} Personen`;
	}
</script>

<svelte:head><title>{data.group.name} · Split</title></svelte:head>

<div class="summary card">
	<div>
		<div class="small muted">Gesamtausgaben</div>
		<div class="amount big">{formatAmount(total, currency)}</div>
	</div>
	<a href="{base}/salden" class="right mine">
		<div class="small muted">{myKasse && myKasse.personIds.length > 1 ? 'Eure Kasse' : 'Dein Saldo'}</div>
		{#if !myKasse || myKasse.balance === 0}
			<div class="amount big">ausgeglichen</div>
		{:else}
			<div class="amount big {myKasse.balance > 0 ? 'positive' : 'negative'}">
				{myKasse.balance > 0 ? '+' : ''}{formatAmount(myKasse.balance, currency)}
			</div>
		{/if}
	</a>
</div>

{#if data.expenses.length || data.drafts.length || data.completion.final}
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
{/if}

{#if form && 'message' in form && form.message}<p class="error">{form.message}</p>{/if}
{#if snapMessage}<p class="notice small">{snapMessage}</p>{/if}

{#if data.drafts.length}
	<h2 class="section">📷 Vorbereitet ({data.drafts.length})</h2>
	<div class="list drafts">
		{#each data.drafts as d (d.id)}
			{@const ocr = d.attachments[0]?.ocr}
			<a href="{base}/ausgaben/{d.id}">
				{#if d.attachments[0]?.mime.startsWith('image/')}
					<img class="thumb" src="/belege/{d.attachments[0].id}" alt="Bon" />
				{:else}
					<span class="cat" style:background="#999">📄</span>
				{/if}
				<div class="grow">
					<div class="ellipsis"><strong>{ocr?.merchant ?? 'Bon'}</strong></div>
					<div class="small muted">
						{formatDate(d.date, { day: 'numeric', month: 'short' })} · {people.get(d.payers[0]?.personId)?.name ?? '?'}
						{#if ocr?.total}· erkannt {cur({ amount: ocr.total, currency: ocr.currency ?? currency })}{/if}
					</div>
				</div>
				<span class="small">Vervollständigen →</span>
			</a>
		{/each}
	</div>
{/if}

{#if awaiting.length}
	<h2 class="section">💳 Abgebuchten Betrag nachtragen ({awaiting.length})</h2>
	<div class="list">
		{#each awaiting as e (e.id)}
			<form method="POST" action="?/charged" class="charge" use:enhance>
				<input type="hidden" name="id" value={e.id} />
				<div class="grow">
					<a href="{base}/ausgaben/{e.id}"><strong>{e.title}</strong></a>
					<div class="small muted">{formatDate(e.date, { day: 'numeric', month: 'short' })} · {cur(e)} · bisher ≈ {formatAmount(e.baseAmount, currency)} (Tageskurs)</div>
				</div>
				<input name="charged" inputmode="decimal" placeholder={currency} class="charged" aria-label="Abgebucht in {currency}" />
				<button class="small-btn primary">OK</button>
			</form>
		{/each}
	</div>
{/if}

{#if pending.length}
	<div class="list pending">
		{#each pending as p (p.clientId)}
			<div>
				<span class="cat" style:background="#999">⏳</span>
				<div class="grow">
					<div class="ellipsis"><strong>{p.payload.title}</strong></div>
					<div class="small {p.error ? 'error' : 'muted'}">{p.error ?? 'Noch nicht übertragen – wartet auf Verbindung'}</div>
				</div>
				<div class="right">
					<div class="amount">{formatAmount(p.payload.amount, p.payload.currency)}</div>
					{#if p.error}
						<button class="link small danger" onclick={() => confirm('Verwerfen?') && discardPending(p.clientId)}>Verwerfen</button>
					{:else}
						<button class="link small" onclick={() => flushPending()}>Jetzt senden</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if data.expenses.length > 8}
	<input type="search" placeholder="Ausgaben durchsuchen …" bind:value={query} class="search" />
{/if}

{#if data.expenses.length === 0 && pending.length === 0 && data.drafts.length === 0}
	<div class="card">
		<p>Noch keine Ausgaben.</p>
		<p class="muted small">
			Tippe auf <strong>+</strong>, um eine Ausgabe einzutragen – oder auf <strong>📷</strong>, um einen Bon direkt im
			Laden zu fotografieren und die Ausgabe später zu vervollständigen.
		</p>
	</div>
{/if}

{#each byDate as [date, list] (date)}
	<div class="date small muted">{formatDate(date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
	<div class="list">
		{#each list as e (e.id)}
			{@const cat = e.categoryId ? cats.get(e.categoryId) : undefined}
			<a href="{base}/ausgaben/{e.id}">
				<span class="cat" style:background={cat?.color ?? '#999'}>{cat?.icon ?? '💶'}</span>
				<div class="grow">
					<div class="ellipsis"><strong>{e.title}</strong></div>
					<div class="small muted ellipsis">
						{e.type === 'income' ? 'erhalten von' : 'bezahlt von'}
						{payerText(e)}
						{#if e.privateAmount > 0}· {formatAmount(e.privateAmount, currency)} privat{/if}
						{#if e.attachments.length}· 📎{/if}
						{#if e.awaitingCharge}· <span title="Abgebuchter Betrag fehlt noch">💳 Kurs vorläufig</span>{/if}
					</div>
				</div>
				<div class="right">
					<div class="amount" class:positive={e.type === 'income'}>
						{e.type === 'income' ? '−' : ''}{formatAmount(e.amount, e.currency)}
					</div>
					{#if e.currency !== currency}
						<div class="small muted">≈ {formatAmount(e.baseAmount, currency)}</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/each}

{#if data.group.status === 'active'}
	<label class="button fab secondary" aria-label="Bon fotografieren" title="Bon fotografieren – später vervollständigen">
		{snapping ? '…' : '📷'}
		<input type="file" accept="image/*" capture="environment" hidden onchange={snap} disabled={snapping} />
	</label>
	<a class="button primary fab" href="{base}/ausgaben/neu" aria-label="Neue Ausgabe">+</a>
{/if}

<style>
	.summary {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.mine {
		color: inherit;
		text-decoration: none;
	}
	.big {
		font-size: 1.35rem;
	}
	.charge {
		align-items: center;
	}
	.charged {
		width: 6rem;
		text-align: right;
	}
	.small-btn {
		min-height: 38px;
		padding: 0.3rem 0.7rem;
	}
	.section {
		margin: 0.5rem 0.25rem 0.5rem;
		font-size: 1rem;
	}
	.thumb {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		object-fit: cover;
		flex-shrink: 0;
	}
	.pending {
		border-style: dashed;
	}
	.search {
		margin-bottom: 1rem;
	}
	.date {
		margin: 0.5rem 0.25rem 0.35rem;
		font-weight: 600;
	}
	.cat {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		flex-shrink: 0;
	}
</style>
