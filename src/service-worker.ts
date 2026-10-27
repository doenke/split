/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `split-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== SHARE_CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

const SHARE_CACHE = 'split-share';

/** Share target: keep the shared file and continue on /teilen, which uploads it. */
async function receiveShare(req: Request) {
	const form = await req.formData();
	const file = form.get('file');
	const cache = await caches.open(SHARE_CACHE);
	await cache.delete('/shared-file');
	if (file instanceof File) {
		await cache.put(
			'/shared-file',
			new Response(file, { headers: { 'content-type': file.type, 'x-file-name': encodeURIComponent(file.name) } })
		);
	}
	return Response.redirect('/teilen?geteilt=1', 303);
}

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	const path = new URL(req.url).pathname;
	if (req.method === 'POST' && path === '/teilen') {
		event.respondWith(receiveShare(req));
		return;
	}
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== location.origin || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) return;

	// static, versioned assets: cache first
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(req).then((r) => r ?? fetch(req)));
		return;
	}

	// pages and data: network first, fall back to the last cached version when offline
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			try {
				const res = await fetch(req);
				if (res.ok && res.type === 'basic') cache.put(req, res.clone());
				return res;
			} catch (err) {
				const cached = await cache.match(req);
				if (cached) return cached;
				throw err;
			}
		})()
	);
});
