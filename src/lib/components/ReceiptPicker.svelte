<script lang="ts">
	let {
		groupId,
		existing = [],
		ids = $bindable([])
	}: { groupId: string; existing?: { id: string; mime: string }[]; ids?: string[] } = $props();

	// svelte-ignore state_referenced_locally
	let files = $state<{ id: string; mime: string; preview?: string }[]>([...existing]);
	let busy = $state(false);
	let message = $state<string | null>(null);

	$effect(() => {
		ids = files.filter((f) => !existing.some((e) => e.id === f.id)).map((f) => f.id);
	});

	/** Scales photos down to max. 2000 px (JPEG) – receipts stay readable, uploads stay small. */
	async function shrink(file: File): Promise<Blob> {
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;
		const bitmap = await createImageBitmap(file).catch(() => null);
		if (!bitmap) return file;
		const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
		if (scale === 1 && file.size < 1_500_000) return file;
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.82));
	}

	export async function upload(file: File) {
		busy = true;
		message = null;
		try {
			const blob = await shrink(file);
			const body = new FormData();
			const name = blob === file ? file.name : file.name.replace(/\.\w+$/, '') + '.jpg';
			body.append('file', new File([blob], name, { type: blob.type || file.type }));
			const res = await fetch(`/gruppen/${groupId}/belege`, { method: 'POST', body });
			const data = await res.json();
			if (!res.ok) throw new Error(data.message ?? 'Hochladen fehlgeschlagen');
			files.push({ id: data.id, mime: data.mime, preview: blob.type.startsWith('image/') ? URL.createObjectURL(blob) : undefined });
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
		for (const f of input.files ?? []) await upload(f);
		input.value = '';
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
		</div>
	{/each}
	<label class="add" class:busy>
		<input type="file" accept="image/*,application/pdf" multiple onchange={onChange} disabled={busy} />
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
