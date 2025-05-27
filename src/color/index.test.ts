import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getColorPresets, getAllColorPresets } from './index';
import { mockFigma } from '../test-setup';

describe('getColorPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset all mock implementations
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
	});

	it('should return empty array when no color variables exist', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
			name: 'font-size',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		});

		const result = await getColorPresets();
		expect(result).toEqual([]);
	});

	it('should generate color presets from color variables', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary-accent',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0.5, b: 0, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Primary 500',
			slug: 'primary-500',
			color: 'var(--wp--custom--color--primary--500)',
		});
		expect(result[1]).toEqual({
			name: 'Secondary Accent',
			slug: 'secondary-accent',
			color: 'var(--wp--custom--color--secondary-accent)',
		});
	});

	it('should handle both variable aliases and direct color values', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'alias',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { type: 'VARIABLE_ALIAS', id: 'var1' },
			},
		};

		const mockReferencedVariable = {
			name: 'primitives/blue/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2)
			.mockResolvedValueOnce(mockReferencedVariable); // For the alias lookup

		const result = await getColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Alias',
			slug: 'alias',
			color: 'var(--wp--custom--color--alias)',
		});
		expect(result[1]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--custom--color--primary)',
		});
	});

	it('should skip non-color variables', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'spacing',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		};

		const mockVariable2 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockVariable1);
				if (id === 'var2') return Promise.resolve(mockVariable2);
				return Promise.resolve(null);
			});

		const result = await getColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--custom--color--primary)',
		});
	});

	it('should sort presets by name', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariable1 = {
			name: 'zebra',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'alpha',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 1, b: 1, a: 1 },
			},
		};

		const mockVariable3 = {
			name: 'beta',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockVariable1);
				if (id === 'var2') return Promise.resolve(mockVariable2);
				if (id === 'var3') return Promise.resolve(mockVariable3);
				return Promise.resolve(null);
			});

		const result = await getColorPresets();

		expect(result).toHaveLength(3);
		expect(result[0].name).toBe('Alpha');
		expect(result[1].name).toBe('Beta');
		expect(result[2].name).toBe('Zebra');
	});

	it('should exclude primitives collection but include other collections', async () => {
		const mockCollections = [
			{
				name: 'Primitives',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
			{
				name: 'Color',
				modes: [{ modeId: 'mode2', name: 'Default' }],
				variableIds: ['var2'],
			},
			{
				name: 'Brand',
				modes: [{ modeId: 'mode3', name: 'Default' }],
				variableIds: ['var3'],
			}
		];

		const mockPrimitivesVariable = {
			name: 'primitive-color',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockColorVariable = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode2: { r: 1, g: 0, b: 0, a: 1 },
			},
		};

		const mockBrandVariable = {
			name: 'brand-secondary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode3: { r: 0, g: 1, b: 0, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockPrimitivesVariable);
				if (id === 'var2') return Promise.resolve(mockColorVariable);
				if (id === 'var3') return Promise.resolve(mockBrandVariable);
				return Promise.resolve(null);
			});

		const result = await getColorPresets();

		// Should include colors from "Color" and "Brand" collections, but exclude "Primitives"
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Brand Secondary',
			slug: 'brand-secondary',
			color: 'var(--wp--custom--color--brand-secondary)',
		});
		expect(result[1]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--custom--color--primary)',
		});
	});

	it('should filter colors by selectedColorIds when provided', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 1, b: 0, a: 1 },
			},
		};

		const mockVariable3 = {
			name: 'tertiary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 0, b: 1, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockVariable1);
				if (id === 'var2') return Promise.resolve(mockVariable2);
				if (id === 'var3') return Promise.resolve(mockVariable3);
				return Promise.resolve(null);
			});

		// Only select var1 and var3
		const result = await getColorPresets(['var1', 'var3']);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--custom--color--primary)',
		});
		expect(result[1]).toEqual({
			name: 'Tertiary',
			slug: 'tertiary',
			color: 'var(--wp--custom--color--tertiary)',
		});
	});
});

describe('getAllColorPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
	});

	it('should return color presets with collection info and resolved colors', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary/accent',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 1, b: 0, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			id: 'var1',
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--custom--color--primary)',
			collectionName: 'Color',
			resolvedColor: '#ff0000'
		});
		expect(result[1]).toEqual({
			id: 'var2',
			name: 'Secondary Accent',
			slug: 'secondary-accent',
			color: 'var(--wp--custom--color--secondary--accent)',
			collectionName: 'Color',
			resolvedColor: '#00ff00'
		});
	});

	it('should handle variable aliases and resolve their colors', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1'],
		};

		const mockAliasVariable = {
			name: 'alias-color',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { type: 'VARIABLE_ALIAS', id: 'primitive-var' },
			},
		};

		const mockPrimitiveVariable = {
			name: 'primitives/blue/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 0, b: 1, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockAliasVariable)
			.mockResolvedValueOnce(mockPrimitiveVariable);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: 'var1',
			name: 'Alias Color',
			slug: 'alias-color',
			color: 'var(--wp--custom--color--alias-color)',
			collectionName: 'Color',
			resolvedColor: '#0000ff'
		});
	});

	it('should sort by collection name then by color name', async () => {
		const mockCollections = [
			{
				name: 'Brand',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
			{
				name: 'Color',
				modes: [{ modeId: 'mode2', name: 'Default' }],
				variableIds: ['var2'],
			}
		];

		const mockBrandVariable = {
			name: 'zebra',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 0, b: 0, a: 1 },
			},
		};

		const mockColorVariable = {
			name: 'alpha',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode2: { r: 1, g: 1, b: 1, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockBrandVariable);
				if (id === 'var2') return Promise.resolve(mockColorVariable);
				return Promise.resolve(null);
			});

		const result = await getAllColorPresets();

		expect(result).toHaveLength(2);
		// Should be sorted by collection name first (Brand comes before Color)
		expect(result[0].collectionName).toBe('Brand');
		expect(result[0].name).toBe('Zebra');
		expect(result[1].collectionName).toBe('Color');
		expect(result[1].name).toBe('Alpha');
	});
}); 