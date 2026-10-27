<script lang="ts">
	let {
		name = 'tags',
		value = [],
		suggestions = []
	}: { name?: string; value?: string[]; suggestions?: string[] } = $props();

	// svelte-ignore state_referenced_locally
	let tags = $state([...value]);
	let input = $state('');
	const available = $derived(suggestions.filter((s) => !tags.includes(s)));

	function add(t: string) {
		const v = t.trim();
		if (v && !tags.includes(v)) tags.push(v);
		input = '';
	}
</script>

<input type="hidden" {name} value={tags.join(',')} />
<div class="tags">
	{#each tags as t (t)}
		<button type="button" class="tag on" onclick={() => (tags = tags.filter((x) => x !== t))} title="Entfernen">{t} ✕</button>
	{/each}
	{#each available as t (t)}
		<button type="button" class="tag" onclick={() => add(t)}>+ {t}</button>
	{/each}
	<input
		class="new"
		placeholder="Neues Merkmal"
		bind:value={input}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ',') {
				e.preventDefault();
				add(input);
			}
		}}
		onblur={() => add(input)}
	/>
</div>

<style>
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.tag {
		min-height: 32px;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--muted);
	}
	.tag.on {
		background: var(--primary-soft);
		border-color: var(--primary);
		color: var(--text);
		font-weight: 700;
	}
	.new {
		width: 9rem;
		padding: 0.3rem 0.6rem;
		font-size: 0.85rem;
	}
</style>
