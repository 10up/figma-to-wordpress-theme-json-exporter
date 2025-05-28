import { describe, it, expect } from 'vitest';
import { camelToKebabCase, buildWpCustomPropertyPath, buildCssVarReference } from './css';

describe('camelToKebabCase', () => {
	it('should convert camelCase to kebab-case', () => {
		expect(camelToKebabCase('camelCase')).toBe('camel-case');
		expect(camelToKebabCase('testString')).toBe('test-string');
		expect(camelToKebabCase('anotherTestString')).toBe('another-test-string');
	});

	it('should handle multiple consecutive capitals', () => {
		expect(camelToKebabCase('XMLHttpRequest')).toBe('xmlhttp-request');
		expect(camelToKebabCase('HTMLParser')).toBe('htmlparser');
	});

	it('should handle strings that are already lowercase', () => {
		expect(camelToKebabCase('lowercase')).toBe('lowercase');
		expect(camelToKebabCase('alllowercase')).toBe('alllowercase');
	});

	it('should handle single words', () => {
		expect(camelToKebabCase('Word')).toBe('word');
		expect(camelToKebabCase('word')).toBe('word');
	});

	it('should handle empty strings', () => {
		expect(camelToKebabCase('')).toBe('');
	});

	it('should handle strings with numbers', () => {
		expect(camelToKebabCase('test123String')).toBe('test123-string');
		expect(camelToKebabCase('test1A2B')).toBe('test1-a2-b');
	});

	it('should handle strings starting with uppercase', () => {
		expect(camelToKebabCase('UpperCase')).toBe('upper-case');
		expect(camelToKebabCase('TestString')).toBe('test-string');
	});
});

describe('buildWpCustomPropertyPath', () => {
	it('should build WordPress custom property path from name parts', () => {
		expect(buildWpCustomPropertyPath(['color', 'primary'])).toBe('--wp--custom--color--primary');
		expect(buildWpCustomPropertyPath(['spacing', 'large'])).toBe('--wp--custom--spacing--large');
	});

	it('should handle single name part', () => {
		expect(buildWpCustomPropertyPath(['primary'])).toBe('--wp--custom--primary');
	});

	it('should handle multiple name parts', () => {
		expect(buildWpCustomPropertyPath(['color', 'button', 'primary', 'background']))
			.toBe('--wp--custom--color--button--primary--background');
	});

	it('should convert camelCase parts to kebab-case', () => {
		expect(buildWpCustomPropertyPath(['colorPalette', 'brandAccent']))
			.toBe('--wp--custom--colorpalette--brandaccent');
	});

	it('should handle mixed case parts', () => {
		expect(buildWpCustomPropertyPath(['ColorPalette', 'BrandAccent', 'HoverState']))
			.toBe('--wp--custom--colorpalette--brandaccent--hoverstate');
	});

	it('should handle empty array', () => {
		expect(buildWpCustomPropertyPath([])).toBe('--wp--custom--');
	});

	it('should handle parts that are already lowercase', () => {
		expect(buildWpCustomPropertyPath(['color', 'primary', 'default']))
			.toBe('--wp--custom--color--primary--default');
	});

	it('should handle uppercase parts', () => {
		expect(buildWpCustomPropertyPath(['COLOR', 'PRIMARY']))
			.toBe('--wp--custom--color--primary');
	});
});

describe('buildCssVarReference', () => {
	it('should build CSS var reference from name parts', () => {
		expect(buildCssVarReference(['color', 'primary']))
			.toBe('var(--wp--custom--color--primary)');
		expect(buildCssVarReference(['spacing', 'large']))
			.toBe('var(--wp--custom--spacing--large)');
	});

	it('should handle single name part', () => {
		expect(buildCssVarReference(['primary']))
			.toBe('var(--wp--custom--primary)');
	});

	it('should handle multiple name parts', () => {
		expect(buildCssVarReference(['color', 'button', 'primary', 'background']))
			.toBe('var(--wp--custom--color--button--primary--background)');
	});

	it('should convert camelCase parts to kebab-case', () => {
		expect(buildCssVarReference(['colorPalette', 'brandAccent']))
			.toBe('var(--wp--custom--colorpalette--brandaccent)');
	});

	it('should handle empty array', () => {
		expect(buildCssVarReference([])).toBe('var(--wp--custom--)');
	});

	it('should handle mixed case parts', () => {
		expect(buildCssVarReference(['FontSize', 'ExtraLarge']))
			.toBe('var(--wp--custom--fontsize--extralarge)');
	});
}); 