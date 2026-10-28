/** Scales photos down to max. 2000 px (JPEG) – receipts stay readable, uploads stay small. */
export async function shrinkImage(file: File): Promise<Blob> {
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

/** A shrunk photo as File (keeps the name, switches the extension to .jpg when converted). */
export async function shrinkToFile(file: File): Promise<File> {
	const blob = await shrinkImage(file);
	if (blob === file) return file;
	return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: blob.type });
}
