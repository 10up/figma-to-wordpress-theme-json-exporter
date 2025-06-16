import { describe, it, expect } from 'vitest';
import { hasCssVarSyntax, extractOriginalValue, generateCssVarSyntax } from './figma-variables';

describe('figma-variables utilities', () => {
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
}); 