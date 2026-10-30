<script lang="ts">
	/** The personal link, to bookmark or keep (it is the person's key to Split). */
	let { url }: { url: string } = $props();
	let copied = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// clipboard blocked: the field can still be selected by hand
		}
	}
</script>

<div class="bookmark">
	<label for="bookmark-url" class="small"><strong>Diese Adresse als Lesezeichen speichern:</strong></label>
	<div class="row">
		<input id="bookmark-url" readonly value={url} class="grow" style="width: auto" onfocus={(e) => e.currentTarget.select()} />
		<button type="button" onclick={copy}>{copied ? '✔' : 'Kopieren'}</button>
	</div>
	<p class="hint">Behalte sie für dich – wer sie hat, kommt als du in Split.</p>
</div>

<style>
	.bookmark {
		margin-top: 0.75rem;
	}
	.bookmark input {
		font-size: 0.85rem;
	}
</style>
