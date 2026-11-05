<script lang="ts">
	import IconPicker from '$lib/components/IconPicker.svelte';
	import { enhance } from '$app/forms';
	import type { SplitRule } from '$lib/core/types';

	let { data, form } = $props();
	let editing = $state<string | null>(null);
	const cats = $derived(new Map(data.categories.map((c) => [c.id, c])));

	const fmt = (n: number) => String(n).replace('.', ',');

	/** One line: who currently takes part (with an own factor where set). */
	function describe(rule: SplitRule) {
		const f = rule.factorOverrides?.persons ?? {};
		const people = membersFor(rule)
			.map((m) => `${m.name}${f[m.personId] !== undefined ? ` ×${fmt(f[m.personId])}` : ''}`)
			.join(', ');
		if (rule.type === 'adults') return `Alle mit vollem Faktor: ${people || 'niemand'} · neue Erwachsene automatisch dabei`;
		return (people || 'niemand') + (rule.type === 'only' ? '' : ' · neue Mitglieder automatisch dabei');
	}

	function membersFor(rule: SplitRule) {
		if (rule.type === 'only') return data.members.filter((m) => rule.included.includes(m.personId));
		if (rule.type === 'all_except') return data.members.filter((m) => !rule.excluded.includes(m.personId));
		if (rule.type === 'adults') return data.members.filter((m) => m.factor >= 1);
		return data.members;
	}

	let mode = $state<'all' | 'adults' | 'persons'>('persons');
	let picked = $state<Record<string, boolean>>({});
	let personFactors = $state<Record<string, string>>({});
	function startEdit(id: string | null, rule?: SplitRule) {
		editing = id ?? 'new';
		// new profiles start with concrete people
		mode = !rule || rule.type === 'only' ? 'persons' : rule.type === 'adults' ? 'adults' : 'all';
		picked = Object.fromEntries(
			data.members.map((m) => [
				m.personId,
				rule?.type === 'only' ? rule.included.includes(m.personId) : rule?.type === 'all_except' ? !rule.excluded.includes(m.personId) : true
			])
		);
		const pf = rule?.factorOverrides?.persons ?? {};
		personFactors = Object.fromEntries(data.members.map((m) => [m.personId, pf[m.personId] !== undefined ? fmt(pf[m.personId]) : '']));
	}
	const keep = () => async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
		await update({ reset: false });
		if (result.type === 'success') editing = null;
	};
</script>

<svelte:head><title>Profile · {data.group.name}</title></svelte:head>

<h2>Ausgaben-Profile</h2>
<p class="small muted">Wiederkehrende Aufteilungen, z.B. „Mietwagen“ nur für die Mitfahrer.</p>

{#if form?.message}<p class="error">{form.message}</p>{/if}

{#snippet editor(p: { id: string; name: string; icon: string; rule: SplitRule; defaultCategoryId: string | null } | null)}
	<form method="POST" action="?/save" class="edit" use:enhance={keep}>
		<input type="hidden" name="id" value={p?.id ?? ''} />
		<div class="row">
			<div class="field">
				<label for="icon-{p?.id}">Symbol</label>
				<IconPicker id="icon-{p?.id}" value={p?.icon ?? '🏷️'} />
			</div>
			<div class="field grow">
				<label for="name-{p?.id}">Name</label>
				<input id="name-{p?.id}" name="name" value={p?.name ?? ''} required placeholder="z.B. Alkohol" />
			</div>
		</div>
		<input type="hidden" name="mode" value={mode} />
		<div class="segmented" style="margin-bottom: 0.75rem">
			<button type="button" class:active={mode === 'persons'} onclick={() => (mode = 'persons')}>Bestimmte Personen</button>
			<button type="button" class:active={mode === 'all'} onclick={() => (mode = 'all')}>Alle (außer …)</button>
			<button type="button" class:active={mode === 'adults'} onclick={() => (mode = 'adults')}>Voller Faktor</button>
		</div>
		<div class="field">
				<span class="label">Wer ist beteiligt – mit welchem Faktor?</span>
				{#each data.members as m (m.personId)}
					<div class="row person">
						<label class="check grow">
							{#if mode === 'adults'}
								<!-- decided by the factor: everyone with 1 or more -->
								<input type="checkbox" checked={m.factor >= 1} disabled />
								{#if m.factor >= 1}<input type="hidden" name="person" value={m.personId} />{/if}
							{:else}
								<input type="checkbox" name="person" value={m.personId} bind:checked={picked[m.personId]} />
							{/if}
							{m.name}
						</label>
						<input
							name="factor_{m.personId}"
							bind:value={personFactors[m.personId]}
							inputmode="decimal"
							placeholder={fmt(m.factor)}
							disabled={mode === 'adults' ? m.factor < 1 : !picked[m.personId]}
							style="width: 5rem"
							aria-label="Faktor für {m.name}"
						/>
					</div>
				{/each}
				<p class="hint">
					Faktor leer = Standard.{mode === 'all'
						? ' Wer später dazukommt, ist automatisch dabei.'
						: mode === 'adults'
							? ' Beteiligt sind alle mit Faktor 1 oder mehr (Erwachsene) – auch wer später dazukommt.'
							: ''}
				</p>
		</div>
		<div class="field">
			<label for="cat-{p?.id}">Mit Kategorie verknüpfen</label>
			<select id="cat-{p?.id}" name="defaultCategoryId">
				<option value="">–</option>
				{#each data.categories as c (c.id)}
					<option value={c.id} selected={c.id === p?.defaultCategoryId}>{c.icon} {c.name}</option>
				{/each}
			</select>
			<p class="hint">Wer das Profil wählt, bekommt die Kategorie dazu – und wer die Kategorie wählt, das Profil.</p>
		</div>
		<div class="row">
			<button class="primary grow">Speichern</button>
			<button type="button" onclick={() => (editing = null)}>Abbrechen</button>
		</div>
	</form>
{/snippet}



<div class="list">
	{#each data.profiles as p (p.id)}
		<div class="profile">
			<div class="row top">
				<span class="icon">{p.icon}</span>
				<div class="grow">
					<strong>{p.name}</strong>
					<div class="small muted">{describe(p.rule)}{#if p.defaultCategoryId && cats.get(p.defaultCategoryId)}{` · verknüpft mit ${cats.get(p.defaultCategoryId)?.icon} ${cats.get(p.defaultCategoryId)?.name}`}{/if}</div>
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
