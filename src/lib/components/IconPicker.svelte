<script lang="ts">
	/** Choose an emoji from a grid (or type any other one); submitted as `name`. */
	let { name = 'icon', value = '🏷️', id }: { name?: string; value?: string; id?: string } = $props();

	const icons = [
		'🏷️', '🍽️', '🍕', '🍔', '🥐', '☕', '🍺', '🍷', '🍸', '🍦',
		'🛒', '🧺', '🏠', '🏨', '⛺', '🔥', '🚗', '⛽', '🅿️', '🚕',
		'🚆', '✈️', '⛴️', '🚲', '🎟️', '🎿', '🏊', '⛳', '🎢', '🎭',
		'🎁', '💊', '👶', '🐶', '🧴', '💡', '📦', '🧹', '🎉', '💶'
	];
	// svelte-ignore state_referenced_locally
	let current = $state(value);
	let open = $state(false);
	function pick(icon: string) {
		current = icon;
		open = false;
	}
	let root = $state<HTMLDivElement>();
	// a click anywhere else or Escape closes the selection
	function outside(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={outside} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="picker" bind:this={root}>
	<input type="hidden" {name} value={current} />
	<button type="button" {id} class="current" aria-haspopup="true" aria-expanded={open} aria-label="Symbol wählen" onclick={() => (open = !open)}>
		{current}
	</button>
	{#if open}
		<div class="pop" role="dialog" aria-label="Symbol auswählen">
			<div class="grid">
				{#each icons as icon (icon)}
					<button type="button" class:on={icon === current} onclick={() => pick(icon)} aria-label={icon}>{icon}</button>
				{/each}
			</div>
			<label class="own small">
				Anderes:
				<input
					maxlength="4"
					value={icons.includes(current) ? '' : current}
					oninput={(e) => e.currentTarget.value && (current = e.currentTarget.value)}
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), (open = false))}
					placeholder="Emoji eingeben"
				/>
				<button type="button" onclick={() => (open = false)}>OK</button>
			</label>
		</div>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}
	.current {
		width: 3.5rem;
		height: 2.75rem;
		font-size: 1.5rem;
		padding: 0;
	}
	.pop {
		position: absolute;
		z-index: 20;
		top: calc(100% + 0.3rem);
		left: 0;
		width: min(19rem, calc(100vw - 2.5rem));
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 0.5rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(2.4rem, 1fr));
		gap: 0.2rem;
	}
	.grid button {
		min-height: 0;
		height: 2.4rem;
		padding: 0;
		font-size: 1.3rem;
		border: 0;
		background: transparent;
	}
	.grid button.on {
		background: var(--primary-soft);
	}
	.own {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0.5rem 0 0;
	}
	.own input {
		flex: 1;
	}
</style>
