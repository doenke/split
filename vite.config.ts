import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: { port: 8347 },
	preview: { port: 8347 },
	test: {
		include: ['src/**/*.test.ts']
	}
});
