<script lang="ts">
	import { exactMatch, normName, suggestions, type KnownKasse, type KnownPerson, type Match, type Suggestion } from '$lib/core/people-match';

	/**
	 * One name field for adding people: suggests known people (and Kassen) while typing; the exact name of one
	 * of them takes that one (hidden personId / kasseId), anything else becomes a new person.
	 */
	let {
		id,
		persons,
		kassen = [],
		taken = [],
		placeholder = 'Name',
		value = $bindable(''),
		match = $bindable<Match>({ kind: 'empty' })
	}: {
		id: string;
		persons: KnownPerson[];
		kassen?: KnownKasse[];
		/** people already there (to say so instead of creating a twin) */
		taken?: { name: string; fullName?: string }[];
		placeholder?: string;
		value?: string;
		match?: Match;
	} = $props();

	let picked = $state<Suggestion | null>(null);
	let open = $state(false);
	let active = $state(-1);

	const label = (s: Suggestion) => (s.kind === 'person' ? s.person.name : s.kasse.name);
	// a Kasse whose members are all here already is not offered
	const offered = $derived(kassen.filter((k) => k.missing.length));
	const list = $derived(suggestions(value, persons, offered));
	$effect(() => {
		// what was picked stays picked as long as the text still is its name
		match = picked && normName(label(picked)) === normName(value) ? picked : exactMatch(value, persons, kassen);
	});
	const already = $derived(match.kind === 'new' ? taken.find((t) => [t.name, t.fullName].some((n) => n && normName(n) === normName(value))) : undefined);
	const showList = $derived(open && list.length > 0 && !(list.length === 1 && match.kind !== 'new' && match.kind !== 'ambiguous'));

	function choose(s: Suggestion) {
		picked = s;
		value = label(s);
		open = false;
		active = -1;
	}

	function onkeydown(e: KeyboardEvent) {
		if (!showList) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			const d = e.key === 'ArrowDown' ? 1 : -1;
			active = (active + d + list.length) % list.length;
		} else if (e.key === 'Enter' && active >= 0) {
			e.preventDefault();
			choose(list[active]);
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="person-input">
	<input
		{id}
		name="name"
		bind:value
		{placeholder}
		required
		autocomplete="off"
		role="combobox"
		aria-expanded={showList}
		aria-controls="{id}-list"
		aria-autocomplete="list"
		oninput={() => {
			open = true;
			active = -1;
		}}
		onfocus={() => (open = true)}
		onblur={() => setTimeout(() => (open = false), 150)}
		{onkeydown}
	/>
	{#if match.kind === 'person'}<input type="hidden" name="personId" value={match.person.id} />{/if}
	{#if match.kind === 'kasse'}<input type="hidden" name="kasseId" value={match.kasse.id} />{/if}
	{#if showList}
		<ul class="suggest" id="{id}-list" role="listbox">
			{#each list as s, i (s.kind + (s.kind === 'person' ? s.person.id : s.kasse.id))}
				<li role="option" aria-selected={i === active} class:active={i === active}>
					<button type="button" onmousedown={(e) => e.preventDefault()} onclick={() => choose(s)}>
						{#if s.kind === 'person'}
							<span>👤 {s.person.name}</span>
							{#if s.person.fullName !== s.person.name}<span class="muted small">{s.person.fullName}</span>{/if}
						{:else}
							<span>👪 {s.kasse.name}</span>
							<span class="muted small">{s.kasse.missing.join(', ')}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
{#if match.kind === 'person'}
	<p class="hint positive">✔ {match.person.fullName} – bekannt aus deinen Gruppen</p>
{:else if match.kind === 'kasse'}
	<p class="hint positive">
		{match.kasse.missing.length ? `✔ Ganze Kasse: ${match.kasse.missing.join(', ')}` : 'Alle aus dieser Kasse sind schon dabei.'}
	</p>
{:else if match.kind === 'ambiguous'}
	<p class="hint">Mehrere Personen heißen so – bitte aus der Liste wählen.</p>
{:else if already}
	<p class="hint">{already.name} ist schon dabei.</p>
{:else if match.kind === 'new' && list.length === 0}
	<p class="hint">Neue Person</p>
{/if}

<style>
	.person-input {
		position: relative;
		flex: 1;
		min-width: 0;
	}
	.person-input input {
		width: 100%;
	}
	.suggest {
		position: absolute;
		left: 0;
		right: 0;
		top: calc(100% + 0.25rem);
		z-index: 15;
		list-style: none;
		margin: 0;
		padding: 0.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.15);
		max-height: 16rem;
		overflow-y: auto;
	}
	.suggest button {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 0.1rem;
		align-items: flex-start;
		background: none;
		border: 0;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		text-align: left;
		font-weight: normal;
		color: var(--text);
	}
	.suggest li.active button,
	.suggest button:hover {
		background: var(--surface-2);
	}
	.hint {
		margin: 0.35rem 0 0;
	}
</style>
