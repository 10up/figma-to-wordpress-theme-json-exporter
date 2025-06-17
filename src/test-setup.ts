import { vi } from 'vitest';

// Mock Figma API
const mockFigma = {
	variables: {
		getLocalVariableCollectionsAsync: vi.fn(),
		getVariableByIdAsync: vi.fn(),
		getVariablesByCollectionIdAsync: vi.fn(),
	},
	getLocalTextStylesAsync: vi.fn(),
	ui: {
		postMessage: vi.fn(),
		onmessage: vi.fn(),
	},
};

// Add figma to global scope (bypass TypeScript checking)
(globalThis as any).figma = mockFigma;

// Mock console methods if needed
globalThis.console = {
	...console,
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
};

export { mockFigma }; 