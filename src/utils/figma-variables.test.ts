import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasCssVarSyntax, extractOriginalValue, generateCssVarSyntax, applyCssVarSyntaxToVariables } from './figma-variables';
import { mockFigma } from '../test-setup';

describe('figma-variables utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasCssVarSyntax', () => {
    it('should detect CSS var syntax', () => {
      expect(hasCssVarSyntax('var(--wp--custom--color--primary, #000)')).toBe(true);
      expect(hasCssVarSyntax('Some code syntax')).toBe(false);
      expect(hasCssVarSyntax('')).toBe(false);
    });
  });

  describe('extractOriginalValue', () => {
    it('should extract original value from CSS var syntax', () => {
      expect(extractOriginalValue('var(--wp--custom--color--primary, #000)')).toBe('#000');
      expect(extractOriginalValue('var(--wp--custom--spacing--base, 16px)')).toBe('16px');
      expect(extractOriginalValue('var(--wp--custom--font--size, 1rem)')).toBe('1rem');
    });

    it('should return null for invalid syntax', () => {
      expect(extractOriginalValue('Some code syntax')).toBe(null);
      expect(extractOriginalValue('')).toBe(null);
    });
  });

  describe('generateCssVarSyntax', () => {
    it('should generate correct CSS var syntax', () => {
      expect(generateCssVarSyntax(['color', 'primary'], '#000')).toBe('var(--wp--custom--color--primary, #000)');
      expect(generateCssVarSyntax(['spacing', 'base'], '16px')).toBe('var(--wp--custom--spacing--base, 16px)');
      expect(generateCssVarSyntax(['typography', 'fontSize', 'large'], '1.5rem')).toBe('var(--wp--custom--typography--fontsize--large, 1.5rem)');
      expect(generateCssVarSyntax(['typography', 'display', 'lg'], '2rem')).toBe('var(--wp--custom--typography--display--lg, 2rem)');
    });
  });

  describe('applyCssVarSyntaxToVariables', () => {
    const mockVariable = (overrides = {}) => ({
      name: 'primary',
      resolvedType: 'COLOR',
      valuesByMode: { mode1: { r: 1, g: 0, b: 0 } },
      codeSyntax: { WEB: '' },
      setVariableCodeSyntax: vi.fn(),
      ...overrides,
    });

    const mockCollection = (overrides = {}) => ({
      name: 'Color',
      variableIds: ['var1'],
      ...overrides,
    });

    it('should apply CSS var syntax to variables without existing syntax', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable();

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, #ff0000)');
      expect(result).toEqual({
        updatedCount: 1,
        skippedCount: 0,
        totalProcessed: 1,
      });
    });

    it('should use raw color values as fallback', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'COLOR',
        valuesByMode: { mode1: { r: 0.5, g: 0.75, b: 1 } }, // Should become #80bfff
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, #80bfff)');
      expect(result.updatedCount).toBe(1);
    });

    it('should use raw float values with px unit as fallback', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'FLOAT',
        valuesByMode: { mode1: 24 },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, 24px)');
      expect(result.updatedCount).toBe(1);
    });

    it('should use raw string values as fallback', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'STRING',
        valuesByMode: { mode1: 'bold' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, bold)');
      expect(result.updatedCount).toBe(1);
    });

    it('should use raw boolean values as fallback', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'BOOLEAN',
        valuesByMode: { mode1: true },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, true)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle variable aliases gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'COLOR',
        valuesByMode: { mode1: { id: 'alias-var-id', type: 'VARIABLE_ALIAS' } },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle variables with no modes gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        valuesByMode: {},
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should skip variables with existing CSS var syntax when overwrite is false', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        codeSyntax: { WEB: 'var(--wp--custom--color--primary, #000000)' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).not.toHaveBeenCalled();
      expect(result).toEqual({
        updatedCount: 0,
        skippedCount: 1,
        totalProcessed: 1,
      });
    });

    it('should overwrite variables with existing CSS var syntax when overwrite is true', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        codeSyntax: { WEB: 'var(--wp--custom--color--primary, #000000)' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: true });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, #000000)');
      expect(result).toEqual({
        updatedCount: 1,
        skippedCount: 0,
        totalProcessed: 1,
      });
    });

    it('should handle Primitives collection without collection prefix', async () => {
      const collections = [mockCollection({ name: 'Primitives' })];
      const variable = mockVariable({ name: 'spacing/base' });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--spacing--base, #ff0000)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle non-Primitives collection with collection prefix', async () => {
      const collections = [mockCollection({ name: 'Typography' })];
      const variable = mockVariable({ name: 'fontSize/large' });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--typography--fontsize--large, #ff0000)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle FLOAT variables with px fallback', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'FLOAT',
        valuesByMode: { mode1: 16 },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, 16px)');
      expect(result.updatedCount).toBe(1);
    });

    it('should use existing codeSyntax as fallback value', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        codeSyntax: { WEB: 'custom-value' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, custom-value)');
      expect(result.updatedCount).toBe(1);
    });

    it('should extract original value from existing CSS var syntax', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        codeSyntax: { WEB: 'var(--wp--custom--color--primary, #123456)' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: true });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, #123456)');
      expect(result.updatedCount).toBe(1);
    });

    it('should use inherit as fallback when no other value is available', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'STRING',
        valuesByMode: {},
        codeSyntax: { WEB: '' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle null variables gracefully', async () => {
      const collections = [mockCollection()];

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(null);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(result).toEqual({
        updatedCount: 0,
        skippedCount: 0,
        totalProcessed: 0,
      });
    });

    it('should handle setVariableCodeSyntax errors gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable();
      variable.setVariableCodeSyntax.mockImplementation(() => {
        throw new Error('Mock error');
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(consoleSpy).toHaveBeenCalledWith('Error updating variable primary:', expect.any(Error));
      expect(result).toEqual({
        updatedCount: 0,
        skippedCount: 0,
        totalProcessed: 0,
      });

      consoleSpy.mockRestore();
    });

    it('should handle multiple collections and variables', async () => {
      const collections = [
        mockCollection({ name: 'Primitives', variableIds: ['var1'] }),
        mockCollection({ name: 'Color', variableIds: ['var2', 'var3'] }),
      ];

      const variables = [
        mockVariable({ name: 'spacing/base' }),
        mockVariable({ name: 'primary' }),
        mockVariable({ name: 'secondary', codeSyntax: { WEB: 'var(--wp--custom--color--secondary, #000)' } }),
      ];

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync
        .mockResolvedValueOnce(variables[0])
        .mockResolvedValueOnce(variables[1])
        .mockResolvedValueOnce(variables[2]);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variables[0].setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--spacing--base, #ff0000)');
      expect(variables[1].setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, #ff0000)');
      expect(variables[2].setVariableCodeSyntax).not.toHaveBeenCalled();

      expect(result).toEqual({
        updatedCount: 2,
        skippedCount: 1,
        totalProcessed: 3,
      });
    });

    it('should handle complex variable names with multiple path segments', async () => {
      const collections = [mockCollection({ name: 'Typography' })];
      const variable = mockVariable({ name: 'fontSize/display/large' });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--typography--fontsize--display--large, #ff0000)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle invalid color values gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'COLOR',
        valuesByMode: { mode1: null }, // Invalid color value
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle invalid float values gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'FLOAT',
        valuesByMode: { mode1: 'not-a-number' }, // Invalid float value
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle invalid string values gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'STRING',
        valuesByMode: { mode1: 123 }, // Non-string value for STRING type
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle invalid boolean values gracefully', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'BOOLEAN',
        valuesByMode: { mode1: 'not-a-boolean' }, // Non-boolean value for BOOLEAN type
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle unknown variable types', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'UNKNOWN_TYPE' as any,
        valuesByMode: { mode1: 'some-value' },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, some-value)');
      expect(result.updatedCount).toBe(1);
    });

    it('should stringify non-alias objects in unknown variable types', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'UNKNOWN_TYPE' as any,
        valuesByMode: { mode1: { someProperty: 'value', notAnAlias: true } }, // Object without 'id' property
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, [object Object])');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle null/undefined values in unknown types', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'UNKNOWN_TYPE' as any,
        valuesByMode: { mode1: null },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle undefined values in unknown types', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'UNKNOWN_TYPE' as any,
        valuesByMode: { mode1: undefined },
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle color values without proper RGB structure', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'COLOR',
        valuesByMode: { mode1: { notRgb: true } }, // Color value without r, g, b properties
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, inherit)');
      expect(result.updatedCount).toBe(1);
    });

    it('should handle numeric values in unknown types', async () => {
      const collections = [mockCollection()];
      const variable = mockVariable({
        resolvedType: 'UNKNOWN_TYPE' as any,
        valuesByMode: { mode1: 0 }, // Falsy but not null/undefined - should trigger String(value)
      });

      mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
      mockFigma.variables.getVariableByIdAsync.mockResolvedValue(variable);

      const result = await applyCssVarSyntaxToVariables({ overwriteExisting: false });

      expect(variable.setVariableCodeSyntax).toHaveBeenCalledWith('WEB', 'var(--wp--custom--color--primary, 0)');
      expect(result.updatedCount).toBe(1);
    });
  });
}); 