<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
	const tabs = [
		['/admin/gruppen', 'Gruppen'],
		['/admin/kassen', 'Kassen'],
		['/admin/personen', 'Personen']
	] as const;
</script>

<a href="/profil" class="small">← Profil</a>
<h1>Instanz-Admin</h1>
<nav class="segmented" style="margin-bottom: 1rem">
	{#each tabs as [href, label] (href)}
		<a {href} class:active={page.url.pathname.startsWith(href)}>{label}</a>
	{/each}
</nav>
{@render children()}
