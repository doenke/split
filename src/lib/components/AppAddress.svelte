<script lang="ts">
	import { page } from '$app/state';
	/** The general address of this Split instance – where you log in with a passkey. */
	const host = $derived(page.url.host);
</script>

<a href="{page.url.origin}/login"><strong>{host}</strong></a>
