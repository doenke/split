<script lang="ts">
	import { shrinkImage as shrink } from '$lib/image';
	import { uploadErrorMessage } from '$lib/upload-error';
	import { clearBusy, markBusy } from '$lib/busy';
	let {
		groupId,
		existing = [],
		ids = $bindable([]),
		reading = null,
		onuploaded
	}: {
		groupId: string;
		existing?: { id: string; mime: string }[];
		ids?: string[];
		/** id of the receipt that is being read right now */
		reading?: string | null;
		onuploaded?: (file: { id: string; mime: string }) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let files = $state<{ id: string; mime: string; preview?: string }[]>([...existing]);
	let busy = $state(false);
	let message = $state<string | null>(null);

	$effect(() => {
		ids = files.filter((f) => !existing.some((e) => e.id === f.id)).map((f) => f.id);
	});

	export async function upload(file: File) {
		busy = true;
		message = null;
		try {
			const blob = await shrink(file);
			const body = new FormData();
			const name = blob === file ? file.name : file.name.replace(/\.\w+$/, '') + '.jpg';
			body.append('file', new File([blob], name, { type: blob.type || file.type }));
			const res = await fetch(`/gruppen/${groupId}/belege`, { method: 'POST', body });
			if (!res.ok) throw new Error(await uploadErrorMessage(res));
			const data = await res.json();
			files.push({ id: data.id, mime: data.mime, preview: blob.type.startsWith('image/') ? URL.createObjectURL(blob) : undefined });
			onuploaded?.({ id: data.id, mime: data.mime });
		} catch (e) {
			message = (e as Error).message;
		} finally {
			busy = false;
		}
	}

	async function remove(id: string) {
		if (!confirm('Beleg entfernen?')) return;
		await fetch(`/belege/${id}`, { method: 'DELETE' });
		files = files.filter((f) => f.id !== id);
	}

	async function onChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		try {
			for (const f of input.files ?? []) await upload(f);
		} finally {
			input.value = '';
			clearBusy();
		}
	}
</script>

<div class="receipts">
	{#each files as f (f.id)}
		<div class="thumb">
			{#if f.mime.startsWith('image/')}
				<a href="/belege/{f.id}" target="_blank" rel="noopener"><img src={f.preview ?? `/belege/${f.id}`} alt="Beleg" /></a>
			{:else}
				<a href="/belege/{f.id}" target="_blank" rel="noopener" class="pdf">📄 PDF</a>
			{/if}
			<button type="button" class="remove" onclick={() => remove(f.id)} aria-label="Beleg entfernen">✕</button>
			{#if reading === f.id}<span class="reading">liest …</span>{/if}
		</div>
	{/each}
	<label class="add" class:busy>
		<input type="file" accept="image/*,application/pdf" multiple onclick={() => markBusy()} oncancel={clearBusy} onchange={onChange} disabled={busy} />
		<span>{busy ? '…' : '📷'}</span>
		<span class="small">{busy ? 'Lädt' : 'Beleg'}</span>
	</label>
</div>
{#if message}<p class="error small">{message}</p>{/if}

<style>
	.receipts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.thumb,
	.add {
		position: relative;
		width: 84px;
		height: 84px;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid var(--border);
		background: var(--surface-2);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.pdf {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-decoration: none;
		font-weight: 600;
	}
	.remove {
		position: absolute;
		top: 3px;
		right: 3px;
		min-height: 0;
		width: 24px;
		height: 24px;
		padding: 0;
		border-radius: 50%;
		font-size: 0.75rem;
		background: rgb(0 0 0 / 0.55);
		color: #fff;
		border: 0;
	}
	.reading {
		position: absolute;
		inset: auto 0 0 0;
		background: rgb(0 0 0 / 0.6);
		color: #fff;
		font-size: 0.75rem;
		text-align: center;
		padding: 0.15rem 0;
	}
	.add {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.5rem;
		margin: 0;
		font-weight: 600;
		border-style: dashed;
	}
	.add input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	.add .small {
		font-size: 0.75rem;
	}
	.busy {
		opacity: 0.6;
	}
</style>
