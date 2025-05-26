import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/test-setup.ts'],
			all: true,
			thresholds: {
				global: {
					branches: 100,
					functions: 100,
					lines: 100,
					statements: 100
				}
			}
		},
		include: ['src/**/*.{test,spec}.ts'],
		exclude: ['node_modules', 'dist']
	},
	resolve: {
		alias: {
			'@': './src'
		}
	}
}); 