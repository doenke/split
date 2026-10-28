/** A readable message for a failed upload response (the body may be HTML from a reverse proxy). */
export async function uploadErrorMessage(res: Response) {
	const data = await res.json().catch(() => null);
	if (data?.message && data.message !== 'Internal Error') return String(data.message);
	if (res.status === 413) return 'Das Foto ist zu groß für den Server (Upload-Limit, z.B. im Reverse-Proxy).';
	return `Speichern fehlgeschlagen (Fehler ${res.status}). Details stehen im Server-Log.`;
}
