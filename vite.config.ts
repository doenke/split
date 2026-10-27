import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

function gitCommit() {
	if (process.env.GIT_SHA) return process.env.GIT_SHA;
	try {
		return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
	} catch {
		return '';
	}
}

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__APP_COMMIT__: JSON.stringify(gitCommit()),
		__BUILD_DATE__: JSON.stringify(process.env.BUILD_DATE ?? new Date().toISOString())
	},
	server: { port: 8347 },
	preview: { port: 8347 },
	test: {
		include: ['src/**/*.test.ts']
	}
});
