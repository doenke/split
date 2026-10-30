<script lang="ts">
	import { amountToInput, formatAmount } from '$lib/core/currency';

	interface Options {
		receiverName?: string;
		paypal: string | null;
		iban: string | null;
		holder: string;
		girocode: string | null;
		weroContact: string | null;
		text: string;
	}

	let { options, amount, currency }: { options: Options | undefined; amount: number; currency: string } = $props();
	let tab = $state<'wero' | 'giro' | 'paypal' | null>(null);
	let copied = $state<string | null>(null);

	const tabs = $derived(
		options
			? ([
					options.weroContact ? (['wero', 'Wero'] as const) : null,
					options.iban ? (['giro', 'Überweisung'] as const) : null,
					options.paypal ? (['paypal', 'PayPal'] as const) : null
				].filter(Boolean) as (readonly ['wero' | 'giro' | 'paypal', string])[])
			: []
	);
	$effect(() => {
		if (!tab && tabs.length) tab = tabs[0][0];
	});

	async function copy(value: string, key: string) {
		await navigator.clipboard.writeText(value);
		copied = key;
		setTimeout(() => (copied = null), 1500);
	}
</script>

{#snippet copyRow(label: string, value: string, key: string)}
	<div class="copy">
		<span class="small muted">{label}</span>
		<span class="grow value">{value}</span>
		<button type="button" class="link small" onclick={() => copy(value, key)}>{copied === key ? '✔' : 'Kopieren'}</button>
	</div>
{/snippet}

<div class="pay">
	{#if !options || tabs.length === 0}
		<p class="small muted">
			{options?.receiverName ?? 'Der Empfänger'} hat noch keine Zahlungsdaten hinterlegt. Frag nach Wero, IBAN oder PayPal –
			oder trag die Zahlung einfach ein, sobald sie erledigt ist.
		</p>
	{:else}
		<div class="segmented small-seg">
			{#each tabs as [key, label] (key)}
				<button type="button" class:active={tab === key} onclick={() => (tab = key)}>{label}</button>
			{/each}
		</div>
		{@render copyRow('Betrag', amountToInput(amount, currency), 'amount')}

		{#if tab === 'wero'}
			{#if options.weroContact}{@render copyRow('Wero an', options.weroContact, 'wero')}{/if}
			<p class="hint">Den Betrag musst du in Wero selbst eintragen.</p>
		{:else if tab === 'giro'}
			{#if options.girocode}
				<div class="center">
					<div class="qr">{@html options.girocode}</div>
					<p class="hint">Mit der Banking-App scannen – Empfänger, IBAN und {formatAmount(amount, currency)} sind schon ausgefüllt.</p>
				</div>
			{/if}
			{@render copyRow('Empfänger', options.holder, 'holder')}
			{@render copyRow('IBAN', options.iban!, 'iban')}
			{@render copyRow('Zweck', options.text, 'text')}
		{:else if tab === 'paypal' && options.paypal}
			<a class="button primary full" href={options.paypal} target="_blank" rel="noopener">{formatAmount(amount, currency)} per PayPal senden</a>
		{/if}
	{/if}
</div>

<style>
	.pay {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding-top: 0.5rem;
	}
	.copy {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}
	.copy .small {
		width: 5.5rem;
		flex-shrink: 0;
	}
	.value {
		font-variant-numeric: tabular-nums;
		word-break: break-all;
	}
	.center {
		text-align: center;
	}
	.qr {
		display: inline-block;
		background: #fff;
		padding: 8px;
		border-radius: 10px;
	}
	.qr :global(svg) {
		display: block;
		width: 200px;
		height: 200px;
	}
	.small-seg button {
		min-height: 34px;
		font-size: 0.85rem;
	}
</style>
