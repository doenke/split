<script lang="ts">
	let {
		name,
		color = '#888',
		url = null,
		size = 36
	}: { name: string; color?: string; url?: string | null; size?: number } = $props();

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase())
			.join('')
	);
	let failed = $state(false);
</script>

{#if url && !failed}
	<img
		class="avatar"
		src={url}
		alt={name}
		width={size}
		height={size}
		style:width="{size}px"
		style:height="{size}px"
		referrerpolicy="no-referrer"
		onerror={() => (failed = true)}
	/>
{:else}
	<span
		class="avatar"
		style:width="{size}px"
		style:height="{size}px"
		style:background={color}
		style:font-size="{size * 0.4}px"
		title={name}>{initials}</span
	>
{/if}

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		color: #fff;
		font-weight: 700;
		flex-shrink: 0;
		object-fit: cover;
	}
</style>
