import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSpacingPresets } from './index';
import { mockFigma } from '../test-setup';

describe('getSpacingPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset all mock implementations
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
	});

	it('should return empty array when no spacing variables exist', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Color',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
			name: 'color/primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0 },
			},
		});

		const result = await getSpacingPresets();
		expect(result).toEqual([]);
	});

	it('should generate spacing presets from spacing variables', async () => {
		const mockSpacingCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'spacing/small',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 8,
			},
		};

		const mockVariable2 = {
			name: 'spacing/large',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 32,
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockSpacingCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getSpacingPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Large',
			slug: 'large',
			size: 'var(--wp--custom--spacing--large)',
		});
		expect(result[1]).toEqual({
			name: 'Small',
			slug: 'small',
			size: 'var(--wp--custom--spacing--small)',
		});
	});

	it('should handle different spacing-related keywords', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3', 'var4'],
		};

		const mockVariables = [
			{
				name: 'gap/medium',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
			{
				name: 'margin/top',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 24 },
			},
			{
				name: 'padding/base',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 12 },
			},
			{
				name: 'size/button',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 40 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(4);
		expect(result.map(p => p.name)).toEqual(['Base', 'Button', 'Medium', 'Top']);
		expect(result.map(p => p.size)).toEqual([
			'var(--wp--custom--spacing--padding--base)',
			'var(--wp--custom--spacing--size--button)',
			'var(--wp--custom--spacing--gap--medium)',
			'var(--wp--custom--spacing--margin--top)',
		]);
	});

	it('should include all FLOAT variables from Spacing collection regardless of name', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariables = [
			{
				name: 'base',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
			{
				name: 'opacity',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 0.8 },
			},
			{
				name: 'weight',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 400 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({
			name: 'Base',
			slug: 'base',
			size: 'var(--wp--custom--spacing--base)',
		});
		expect(result[1]).toEqual({
			name: 'Opacity',
			slug: 'opacity',
			size: 'var(--wp--custom--spacing--opacity)',
		});
		expect(result[2]).toEqual({
			name: 'Weight',
			slug: 'weight',
			size: 'var(--wp--custom--spacing--weight)',
		});
	});

	it('should skip non-FLOAT variables', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'spacing/color',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0 },
			},
		};

		const mockVariable2 = {
			name: 'spacing/size',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Size',
			slug: 'size',
			size: 'var(--wp--custom--spacing--size)',
		});
	});

	it('should sort presets by name', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariables = [
			{
				name: 'spacing/zebra',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 64 },
			},
			{
				name: 'spacing/alpha',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 8 },
			},
			{
				name: 'spacing/beta',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(3);
		expect(result[0].name).toBe('Alpha');
		expect(result[1].name).toBe('Beta');
		expect(result[2].name).toBe('Zebra');
	});

	it('should only include Spacing collection and spacing variables from Primitives collection', async () => {
		const mockCollections = [
			{
				name: 'Primitives',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2'],
			},
			{
				name: 'Spacing',
				modes: [{ modeId: 'mode2', name: 'Default' }],
				variableIds: ['var3'],
			},
			{
				name: 'Layout',
				modes: [{ modeId: 'mode3', name: 'Default' }],
				variableIds: ['var4'],
			}
		];

		const mockPrimitivesSpacingVariable = {
			name: 'spacing/primitive',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 8,
			},
		};

		const mockPrimitivesNonSpacingVariable = {
			name: 'color/primary',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 255,
			},
		};

		const mockSpacingVariable = {
			name: 'base',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode2: 16,
			},
		};

		const mockLayoutVariable = {
			name: 'gap/large',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode3: 32,
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockPrimitivesSpacingVariable);
				if (id === 'var2') return Promise.resolve(mockPrimitivesNonSpacingVariable);
				if (id === 'var3') return Promise.resolve(mockSpacingVariable);
				if (id === 'var4') return Promise.resolve(mockLayoutVariable);
				return Promise.resolve(null);
			});

		const result = await getSpacingPresets();

		// Should include all variables from "Spacing" collection and only spacing variables from "Primitives"
		// Should exclude "Layout" collection entirely and non-spacing variables from "Primitives"
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Base',
			slug: 'base',
			size: 'var(--wp--custom--spacing--base)',
		});
		expect(result[1]).toEqual({
			name: 'Primitive',
			slug: 'primitive',
			size: 'var(--wp--custom--spacing--primitive)',
		});
	});

	it('should handle complex variable names with camelCase and special characters', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariables = [
			{
				name: 'spacing/buttonPadding-large',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 24 },
			},
			{
				name: 'spacing/card_margin_top',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Button Padding Large',
			slug: 'buttonpadding-large',
			size: 'var(--wp--custom--spacing--buttonpadding-large)',
		});
		expect(result[1]).toEqual({
			name: 'Card Margin Top',
			slug: 'card-margin-top',
			size: 'var(--wp--custom--spacing--card-margin-top)',
		});
	});

	it('should handle null variables gracefully', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable = {
			name: 'spacing/valid',
			resolvedType: 'FLOAT',
			valuesByMode: { mode1: 16 },
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(mockVariable);

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Valid',
			slug: 'valid',
			size: 'var(--wp--custom--spacing--valid)',
		});
	});

	it('should handle variables with undefined values', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'spacing/undefined',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: undefined,
			},
		};

		const mockVariable2 = {
			name: 'spacing/valid',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var1') return Promise.resolve(mockVariable1);
				if (id === 'var2') return Promise.resolve(mockVariable2);
				return Promise.resolve(null);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Valid',
			slug: 'valid',
			size: 'var(--wp--custom--spacing--valid)',
		});
	});

	it('should format fluid spacing variables with special naming', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3', 'var4'],
		};

		const mockVariables = [
			{
				name: '24_16',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
			{
				name: '16_8',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 8 },
			},
			{
				name: '16_16',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
			{
				name: 'regular',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 12 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(4);
		expect(result[0]).toEqual({
			name: '16',
			slug: '16-16',
			size: 'var(--wp--custom--spacing--16-16)',
		});
		expect(result[1]).toEqual({
			name: 'Fluid (16 → 24)',
			slug: '24-16',
			size: 'var(--wp--custom--spacing--24-16)',
		});
		expect(result[2]).toEqual({
			name: 'Fluid (8 → 16)',
			slug: '16-8',
			size: 'var(--wp--custom--spacing--16-8)',
		});
		expect(result[3]).toEqual({
			name: 'Regular',
			slug: 'regular',
			size: 'var(--wp--custom--spacing--regular)',
		});
	});

	it('should handle fluid spacing pattern names', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariables = [
			{
				name: 'spacing/32_16',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 32 },
			},
			{
				name: 'spacing/24_24',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 24 },
			},
			{
				name: 'spacing/48_12',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 48 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({
			name: '24',
			slug: '24-24',
			size: 'var(--wp--custom--spacing--24-24)',
		});
		expect(result[1]).toEqual({
			name: 'Fluid (12 → 48)',
			slug: '48-12',
			size: 'var(--wp--custom--spacing--48-12)',
		});
		expect(result[2]).toEqual({
			name: 'Fluid (16 → 32)',
			slug: '32-16',
			size: 'var(--wp--custom--spacing--32-16)',
		});
	});

	it('should handle fluid spacing pattern with same min and max values', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1'],
		};

		const mockVariable = {
			name: 'spacing/16_16', // Same min and max values
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariable);

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: '16', // Should use single value when min === max
			slug: '16-16',
			size: 'var(--wp--custom--spacing--16-16)',
		});
	});

	it('should handle fluid spacing pattern with different min and max values', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1'],
		};

		const mockVariable = {
			name: 'spacing/24_16', // Different min and max values
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 20,
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariable);

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Fluid (16 → 24)', // Should show fluid pattern
			slug: '24-16',
			size: 'var(--wp--custom--spacing--24-16)',
		});
	});

	it('should skip collections with no modes', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Empty Spacing',
				modes: [], // No modes
				variableIds: ['var1'],
			},
			{
				name: 'Spacing', // Use recognized collection name
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var2'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				if (id === 'var2') {
					return Promise.resolve({
						name: 'valid',
						resolvedType: 'FLOAT',
						valuesByMode: {
							mode1: 16,
						},
					});
				}
				return Promise.resolve(null);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Valid',
			slug: 'valid',
			size: 'var(--wp--custom--spacing--valid)',
		});
	});

	it('should handle spacing collection variables without spacing prefix', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariables = [
			{
				name: 'base',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 16 },
			},
			{
				name: 'large',
				resolvedType: 'FLOAT',
				valuesByMode: { mode1: 32 },
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockImplementation((id: string) => {
				const index = parseInt(id.replace('var', '')) - 1;
				return Promise.resolve(mockVariables[index]);
			});

		const result = await getSpacingPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Base',
			slug: 'base',
			size: 'var(--wp--custom--spacing--base)',
		});
		expect(result[1]).toEqual({
			name: 'Large',
			slug: 'large',
			size: 'var(--wp--custom--spacing--large)',
		});
	});

	it('should handle spacing collection variables that already have spacing prefix', async () => {
		const mockCollection = {
			name: 'Spacing',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1'],
		};

		const mockVariable = {
			name: 'spacing/medium', // Already has spacing prefix
			resolvedType: 'FLOAT',
			valuesByMode: { mode1: 24 },
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockCollection,
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariable);

		const result = await getSpacingPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Medium',
			slug: 'medium',
			size: 'var(--wp--custom--spacing--medium)', // Should not double the spacing prefix
		});
	});
}); 