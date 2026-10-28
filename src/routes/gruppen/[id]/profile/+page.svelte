<script lang="ts">
	import { enhance } from '$app/forms';
	import TagInput from '$lib/components/TagInput.svelte';
	import type { SplitRule } from '$lib/core/types';

	let { data, form } = $props();
	let editing = $state<string | null>(null);
	const cats = $derived(new Map(data.categories.map((c) => [c.id, c])));
	const tagSuggestions = $derived([...new Set(['Kind', 'Erwachsen', ...data.members.flatMap((m) => m.tags)])]);

	const names = $derived(new Map(data.members.map((m) => [m.personId, m.name])));
	const fmt = (n: number) => String(n).replace('.', ',');

	function describe(rule: SplitRule) {
		if (rule.type === 'only') {
			const f = rule.factorOverrides?.persons ?? {};
			return rule.included.map((id) => `${names.get(id) ?? '?'}${f[id] !== undefined ? ` ×${fmt(f[id])}` : ''}`).join(', ') || 'niemand';
		}
		const parts: string[] = [];
		if (rule.tagFilter?.require?.length) parts.push(`nur mit ${rule.tagFilter.require.join(', ')}`);
		if (rule.tagFilter?.exclude?.length) parts.push(`ohne ${rule.tagFilter.exclude.join(', ')}`);
		for (const [t, v] of Object.entries(rule.factorOverrides?.tags ?? {})) {
			parts.push(`${t} zählt ${String(v).replace('.', ',')}`);
		}
		return parts.length ? `Alle, ${parts.join(' · ')}` : 'Alle (Standard-Faktoren)';
	}

	function membersFor(rule: SplitRule) {
		if (rule.type === 'only') return data.members.filter((m) => rule.included.includes(m.personId));
		return data.members.filter((m) => {
			if (rule.tagFilter?.require?.some((t) => !m.tags.includes(t))) return false;
			if (rule.tagFilter?.exclude?.some((t) => m.tags.includes(t))) return false;
			return true;
		});
	}

	let overrides = $state<{ tag: string; factor: string }[]>([]);
	let mode = $state<'tags' | 'persons'>('tags');
	let picked = $state<Record<string, boolean>>({});
	let personFactors = $state<Record<string, string>>({});
	function startEdit(id: string | null, rule?: SplitRule) {
		editing = id ?? 'new';
		// new profiles start with concrete people; tag-based ones stay available
		mode = !rule || rule.type === 'only' ? 'persons' : 'tags';
		picked = Object.fromEntries(data.members.map((m) => [m.personId, rule?.type === 'only' ? rule.included.includes(m.personId) : true]));
		const pf = rule?.factorOverrides?.persons ?? {};
		personFactors = Object.fromEntries(data.members.map((m) => [m.personId, pf[m.personId] !== undefined ? fmt(pf[m.personId]) : '']));
		overrides = Object.entries(rule?.factorOverrides?.tags ?? {}).map(([tag, f]) => ({ tag, factor: String(f).replace('.', ',') }));
	}
	const keep = () => async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
		await update({ reset: false });
		if (result.type === 'success') editing = null;
	};
</script>

<svelte:head><title>Profile · {data.group.name}</title></svelte:head>

<h2>Ausgaben-Profile</h2>
<p class="small muted">
	Profile sind Vorlagen für wiederkehrende Aufteilungen, z.B. „Mietwagen“ nur für die Mitfahrer – mit
	<strong>bestimmten Personen</strong> und auf Wunsch eigenen Faktoren. Beim Erfassen einer Ausgabe wählst du das
	Profil mit einem Tipp.
</p>

{#if form?.message}<p class="error">{form.message}</p>{/if}

{#snippet editor(p: { id: string; name: string; icon: string; rule: SplitRule; defaultCategoryId: string | null } | null)}
	<form method="POST" action="?/save" class="edit" use:enhance={keep}>
		<input type="hidden" name="id" value={p?.id ?? ''} />
		<div class="row">
			<div class="field" style="width: 4.5rem">
				<label for="icon-{p?.id}">Symbol</label>
				<input id="icon-{p?.id}" name="icon" value={p?.icon ?? '🏷️'} maxlength="4" />
			</div>
			<div class="field grow">
				<label for="name-{p?.id}">Name</label>
				<input id="name-{p?.id}" name="name" value={p?.name ?? ''} required placeholder="z.B. Alkohol" />
			</div>
		</div>
		<input type="hidden" name="mode" value={mode} />
		<div class="segmented" style="margin-bottom: 0.75rem">
			<button type="button" class:active={mode === 'persons'} onclick={() => (mode = 'persons')}>Bestimmte Personen</button>
			<button type="button" class:active={mode === 'tags'} onclick={() => (mode = 'tags')}>Nach Merkmalen</button>
		</div>
		{#if mode === 'persons'}
			<div class="field">
				<span class="label">Wer ist beteiligt – mit welchem Faktor?</span>
				{#each data.members as m (m.personId)}
					<div class="row person">
						<label class="check grow">
							<input type="checkbox" name="person" value={m.personId} bind:checked={picked[m.personId]} />
							{m.name}
						</label>
						<input
							name="factor_{m.personId}"
							bind:value={personFactors[m.personId]}
							inputmode="decimal"
							placeholder={fmt(m.factor)}
							disabled={!picked[m.personId]}
							style="width: 5rem"
							aria-label="Faktor für {m.name}"
						/>
					</div>
				{/each}
				<p class="hint">Leer = Standard-Faktor der Person. Personen, die später dazukommen, sind hier nicht automatisch dabei.</p>
			</div>
		{:else}
		<div class="field">
			<span class="label">Nur Personen mit Merkmal</span>
			<TagInput name="require" value={p?.rule.tagFilter?.require ?? []} suggestions={tagSuggestions} />
		</div>
		<div class="field">
			<span class="label">Personen mit diesem Merkmal ausnehmen</span>
			<TagInput name="exclude" value={p?.rule.tagFilter?.exclude ?? []} suggestions={tagSuggestions} />
		</div>
		<div class="field">
			<span class="label">Abweichende Faktoren</span>
			{#each overrides as o, i (i)}
				<div class="row" style="margin-bottom: 0.4rem">
					<input name="overrideTag" bind:value={o.tag} placeholder="Merkmal, z.B. Kind" class="grow" style="width: auto" list="tags" />
					<input name="overrideFactor" bind:value={o.factor} inputmode="decimal" style="width: 5rem" placeholder="1" />
					<button type="button" class="link danger" onclick={() => overrides.splice(i, 1)}>✕</button>
				</div>
			{/each}
			<button type="button" class="link" onclick={() => overrides.push({ tag: '', factor: '1' })}>+ Faktor für ein Merkmal</button>
			<p class="hint">Z.B. „Kind = 1“ bei der Unterkunft: Kinder zahlen hier voll, obwohl ihr Standard-Faktor 0,5 ist.</p>
		</div>
		{/if}
		<div class="field">
			<label for="cat-{p?.id}">Kategorie vorschlagen</label>
			<select id="cat-{p?.id}" name="defaultCategoryId">
				<option value="">–</option>
				{#each data.categories as c (c.id)}
					<option value={c.id} selected={c.id === p?.defaultCategoryId}>{c.icon} {c.name}</option>
				{/each}
			</select>
		</div>
		<div class="row">
			<button class="primary grow">Speichern</button>
			<button type="button" onclick={() => (editing = null)}>Abbrechen</button>
		</div>
	</form>
{/snippet}

<datalist id="tags">
	{#each tagSuggestions as t (t)}<option value={t}></option>{/each}
</datalist>

<div class="list">
	{#each data.profiles as p (p.id)}
		<div class="profile">
			<div class="row top">
				<span class="icon">{p.icon}</span>
				<div class="grow">
					<strong>{p.name}</strong>
					<div class="small muted">{describe(p.rule)}{#if p.defaultCategoryId && cats.get(p.defaultCategoryId)}{` · ${cats.get(p.defaultCategoryId)?.name}`}{/if}</div>
					<div class="small muted">Derzeit: {membersFor(p.rule).map((m) => m.name).join(', ') || 'niemand'}</div>
				</div>
				{#if data.isAdmin && editing !== p.id}
					<button class="link" onclick={() => startEdit(p.id, p.rule)}>Bearbeiten</button>
				{/if}
			</div>
			{#if editing === p.id}
				{@render editor(p)}
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`Profil „${p.name}“ löschen? Bestehende Ausgaben behalten ihre Aufteilung.`)) cancel();
					}}
				>
					<input type="hidden" name="id" value={p.id} />
					<button class="link danger small">Profil löschen</button>
				</form>
			{/if}
		</div>
	{:else}
		<div class="muted small">Noch keine Profile.</div>
	{/each}
</div>

{#if data.isAdmin}
	{#if editing === 'new'}
		<div class="card">{@render editor(null)}</div>
	{:else}
		<button class="primary full" onclick={() => startEdit(null)}>+ Neues Profil</button>
	{/if}
{/if}

<style>
	.profile {
		display: block !important;
	}
	.top {
		flex-wrap: nowrap;
	}
	.icon {
		font-size: 1.5rem;
	}
	.edit {
		margin-top: 0.75rem;
	}
	.person {
		flex-wrap: nowrap;
		margin-bottom: 0.25rem;
	}
	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}
</style>
