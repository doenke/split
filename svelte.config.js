import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
let commit = process.env.GIT_SHA ?? '';
if (!commit) {
	try {
		commit = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
	} catch {
		// no git in the Docker build context – GIT_SHA is passed as build argument there
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ out: 'build' }),
		csrf: { trustedOrigins: [] },
		// every build is a new version: open apps notice it and reload on the next navigation
		version: { name: `${pkg.version}+${commit.slice(0, 12) || Date.now()}`, pollInterval: 60_000 }
	}
};

export default config;
