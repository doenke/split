<script lang="ts">
	/** First name (required) and last name (optional) for a new person; the server joins them. */
	let { id = 'name', firstPlaceholder = 'z.B. Lea', self = false }: { id?: string; firstPlaceholder?: string; self?: boolean } = $props();
</script>

<div class="row names">
	<div class="field grow">
		<label for="{id}-first">Vorname</label>
		<input id="{id}-first" name="firstName" placeholder={firstPlaceholder} required autocomplete={self ? 'given-name' : 'off'} />
	</div>
	<div class="field grow">
		<label for="{id}-last">Nachname <span class="muted small">(optional)</span></label>
		<input id="{id}-last" name="lastName" autocomplete={self ? 'family-name' : 'off'} />
	</div>
</div>

<style>
	.names {
		align-items: flex-start;
	}
	.names .field {
		min-width: 0;
	}
	.names input {
		width: 100%;
	}
</style>
