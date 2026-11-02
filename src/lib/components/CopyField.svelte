<script lang="ts">
	/** A read-only value (e.g. a link) with a copy button next to it. */
	let { value, label = 'Link' }: { value: string; label?: string } = $props();
	let copied = $state(false);
	let input = $state<HTMLInputElement>();
	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// clipboard blocked (e.g. not https): select it, so it can be copied by hand
			input?.select();
			document.execCommand?.('copy');
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="row copyfield">
	<input bind:this={input} readonly {value} aria-label={label} class="grow" style="width: auto" onfocus={(e) => e.currentTarget.select()} />
	<button type="button" onclick={copy}>{copied ? '✔ Kopiert' : 'Kopieren'}</button>
</div>

<style>
	.copyfield input {
		font-size: 0.85rem;
	}
	.copyfield button {
		white-space: nowrap;
	}
</style>
