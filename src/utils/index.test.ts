import { describe, it, expect } from 'vitest';
import {
	isVariableAlias,
	mergeCollectionData,
	deepMerge,
	shouldAddPxUnit,
	formatValueWithUnits,
	shouldUseRemForCollection,
	convertPxToRem,
	roundToMax3Decimals,
	capitalizeFirstLetter
} from './index';

describe('isVariableAlias', () => {
	it('should return true for variable alias objects', () => {
		expect(isVariableAlias({ type: "VARIABLE_ALIAS" })).toBe(true);
		expect(isVariableAlias({ type: "VARIABLE_ALIAS", id: "123" })).toBe(true);
	});

	it('should return false for non-variable alias objects', () => {
		expect(isVariableAlias({ type: "OTHER" })).toBe(false);
		expect(isVariableAlias({ id: "123" })).toBe(false);
		expect(isVariableAlias({})).toBe(false);
	});

	it('should return false for non-objects', () => {
		expect(isVariableAlias(null)).toBe(false);
		expect(isVariableAlias(undefined)).toBe(false);
		expect(isVariableAlias("string")).toBe(false);
		expect(isVariableAlias(123)).toBe(false);
		expect(isVariableAlias(true)).toBe(false);
		expect(isVariableAlias([])).toBe(false);
	});
});

describe('deepMerge', () => {
	it('should merge two objects deeply', () => {
		const target = { a: { b: 1 }, c: 2 };
		const source = { a: { d: 3 }, e: 4 };
		const result = deepMerge(target, source);
		
		expect(result).toEqual({ a: { b: 1, d: 3 }, c: 2, e: 4 });
		// Should not modify originals
		expect(target).toEqual({ a: { b: 1 }, c: 2 });
		expect(source).toEqual({ a: { d: 3 }, e: 4 });
	});

	it('should overwrite properties when source has different type', () => {
		const target = { a: 1 };
		const source = { a: { b: 2 } };
		const result = deepMerge(target, source);
		
		expect(result).toEqual({ a: { b: 2 } });
	});

	it('should handle non-object target', () => {
		expect(deepMerge("string", { a: 1 })).toEqual({ a: 1 });
		expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
		expect(deepMerge(123, { a: 1 })).toEqual({ a: 1 });
	});

	it('should handle non-object source', () => {
		expect(deepMerge({ a: 1 }, "string")).toBe("string");
		expect(deepMerge({ a: 1 }, null)).toEqual({ a: 1 });
		expect(deepMerge({ a: 1 }, 123)).toBe(123);
	});

	it('should handle both non-objects', () => {
		expect(deepMerge("target", "source")).toBe("source");
		expect(deepMerge(123, 456)).toBe(456);
	});

	it('should handle empty objects', () => {
		expect(deepMerge({}, {})).toEqual({});
		expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
		expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
	});

	it('should handle nested arrays', () => {
		const target = { a: [1, 2] };
		const source = { a: [3, 4] };
		const result = deepMerge(target, source);
		
		expect(result).toEqual({ a: { "0": 3, "1": 4 } }); // Arrays are treated as objects and merged
	});

	it('should handle complex nested structures', () => {
		const target = {
			level1: {
				level2: {
					level3: { a: 1, b: 2 }
				},
				other: "value"
			}
		};
		const source = {
			level1: {
				level2: {
					level3: { b: 3, c: 4 }
				},
				new: "property"
			}
		};
		const result = deepMerge(target, source);
		
		expect(result).toEqual({
			level1: {
				level2: {
					level3: { a: 1, b: 3, c: 4 }
				},
				other: "value",
				new: "property"
			}
		});
	});
});

describe('mergeCollectionData', () => {
	it('should merge collection data with empty collection name directly into base theme', () => {
		const baseTheme = { existing: "value" };
		const collectionData = { color: { primary: "#000" } };
		
		mergeCollectionData(baseTheme, "", collectionData);
		
		expect(baseTheme).toEqual({
			existing: "value",
			color: { primary: "#000" }
		});
	});

	it('should deep merge when empty collection name and property exists', () => {
		const baseTheme = { color: { secondary: "#fff" } };
		const collectionData = { color: { primary: "#000" } };
		
		mergeCollectionData(baseTheme, "", collectionData);
		
		expect(baseTheme).toEqual({
			color: { secondary: "#fff", primary: "#000" }
		});
	});

	it('should merge collection data under collection name when section exists', () => {
		const baseTheme = { spacing: { small: "8px" } };
		const collectionData = { large: "24px" };
		
		mergeCollectionData(baseTheme, "spacing", collectionData);
		
		expect(baseTheme).toEqual({
			spacing: { small: "8px", large: "24px" }
		});
	});

	it('should add new section when collection name does not exist', () => {
		const baseTheme = { existing: "value" };
		const collectionData = { primary: "#000" };
		
		mergeCollectionData(baseTheme, "color", collectionData);
		
		expect(baseTheme).toEqual({
			existing: "value",
			color: { primary: "#000" }
		});
	});

	it('should handle complex nested merging', () => {
		const baseTheme = {
			color: {
				text: { primary: "#000" }
			}
		};
		const collectionData = {
			background: { primary: "#fff" },
			text: { secondary: "#666" }
		};
		
		mergeCollectionData(baseTheme, "color", collectionData);
		
		expect(baseTheme).toEqual({
			color: {
				text: { primary: "#000", secondary: "#666" },
				background: { primary: "#fff" }
			}
		});
	});
});

describe('shouldAddPxUnit', () => {
	it('should return true for spacing categories', () => {
		expect(shouldAddPxUnit(['spacing', 'large'], 16)).toBe(true);
		expect(shouldAddPxUnit(['custom', 'spacing'], 8)).toBe(true);
	});

	it('should return true for font categories', () => {
		expect(shouldAddPxUnit(['font', 'size'], 16)).toBe(true);
		expect(shouldAddPxUnit(['typography', 'font'], 14)).toBe(true);
	});

	it('should return true for size categories', () => {
		expect(shouldAddPxUnit(['size', 'large'], 24)).toBe(true);
		expect(shouldAddPxUnit(['button', 'size'], 12)).toBe(true);
	});

	it('should return true for all px categories', () => {
		const pxCategories = ['spacing', 'font', 'size', 'grid', 'radius', 'width', 'height'];
		pxCategories.forEach(category => {
			expect(shouldAddPxUnit([category], 16)).toBe(true);
			expect(shouldAddPxUnit(['prefix', category, 'suffix'], 16)).toBe(true);
		});
	});

	it('should return false for non-px categories', () => {
		expect(shouldAddPxUnit(['color', 'primary'], 16)).toBe(false);
		expect(shouldAddPxUnit(['opacity'], 0.5)).toBe(false);
		expect(shouldAddPxUnit(['other'], 123)).toBe(false);
	});

	it('should return false for non-number values', () => {
		expect(shouldAddPxUnit(['spacing'], 'string')).toBe(false);
		expect(shouldAddPxUnit(['spacing'], null)).toBe(false);
		expect(shouldAddPxUnit(['spacing'], undefined)).toBe(false);
		expect(shouldAddPxUnit(['spacing'], {})).toBe(false);
	});

	it('should return false for zero values', () => {
		expect(shouldAddPxUnit(['spacing'], 0)).toBe(false);
	});

	it('should handle case insensitive matching', () => {
		expect(shouldAddPxUnit(['SPACING'], 16)).toBe(true);
		expect(shouldAddPxUnit(['Spacing'], 16)).toBe(true);
		expect(shouldAddPxUnit(['SpAcInG'], 16)).toBe(true);
	});
});

describe('formatValueWithUnits', () => {
	it('should add px units when appropriate', () => {
		expect(formatValueWithUnits(['spacing'], 16)).toBe('16px');
		expect(formatValueWithUnits(['font', 'size'], 14)).toBe('14px');
	});

	it('should not add px units when not appropriate', () => {
		expect(formatValueWithUnits(['color'], 255)).toBe(255);
		expect(formatValueWithUnits(['opacity'], 0.5)).toBe(0.5);
	});

	it('should handle non-number values', () => {
		expect(formatValueWithUnits(['spacing'], 'already-string')).toBe('already-string');
		expect(formatValueWithUnits(['spacing'], null)).toBe(null);
	});

	it('should handle zero values', () => {
		expect(formatValueWithUnits(['spacing'], 0)).toBe(0);
	});

	it('should use rem units when rem conversion is enabled and collection matches', () => {
		const remCollections = { font: true, primitives: false, spacing: true };
		
		expect(formatValueWithUnits(['font', 'size'], 16, true, remCollections)).toBe('1rem');
		expect(formatValueWithUnits(['spacing', 'large'], 32, true, remCollections)).toBe('2rem');
		expect(formatValueWithUnits(['typography', 'font'], 24, true, remCollections)).toBe('1.5rem');
	});

	it('should use px units when rem conversion is enabled but collection does not match', () => {
		const remCollections = { font: true, primitives: false, spacing: false };
		
		expect(formatValueWithUnits(['spacing', 'large'], 32, true, remCollections)).toBe('32px');
		expect(formatValueWithUnits(['radius', 'small'], 8, true, remCollections)).toBe('8px');
	});

	it('should use px units when rem conversion is disabled', () => {
		const remCollections = { font: true, primitives: true, spacing: true };
		
		expect(formatValueWithUnits(['font', 'size'], 16, false, remCollections)).toBe('16px');
		expect(formatValueWithUnits(['spacing', 'large'], 32, false, remCollections)).toBe('32px');
	});

	it('should use px units when no rem collections are provided', () => {
		expect(formatValueWithUnits(['font', 'size'], 16, true, undefined)).toBe('16px');
		expect(formatValueWithUnits(['font', 'size'], 16, true, null)).toBe('16px');
		expect(formatValueWithUnits(['font', 'size'], 16, true, {})).toBe('16px');
	});

	it('should handle custom collection names in rem collections', () => {
		const remCollections = { myCustomCollection: true, otherCollection: false };
		
		expect(formatValueWithUnits(['myCustomCollection', 'size'], 16, true, remCollections)).toBe('1rem');
		expect(formatValueWithUnits(['otherCollection', 'size'], 16, true, remCollections)).toBe('16px');
	});
});

describe('shouldUseRemForCollection', () => {
	it('should return false when no rem collections provided', () => {
		expect(shouldUseRemForCollection(['font', 'size'], undefined)).toBe(false);
		expect(shouldUseRemForCollection(['font', 'size'], null)).toBe(false);
		expect(shouldUseRemForCollection(['font', 'size'], {})).toBe(false);
	});

	it('should return true for font/typography variables when font collection is enabled', () => {
		const remCollections = { font: true, primitives: false, spacing: false };
		
		expect(shouldUseRemForCollection(['font', 'size'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['typography', 'heading'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['heading', 'font'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['text', 'font', 'size'], remCollections)).toBe(true);
	});

	it('should return false for font/typography variables when font collection is disabled', () => {
		const remCollections = { font: false, primitives: true, spacing: true };
		
		expect(shouldUseRemForCollection(['font', 'size'], remCollections)).toBe(false);
		expect(shouldUseRemForCollection(['typography', 'heading'], remCollections)).toBe(false);
	});

	it('should return true for primitives variables when primitives collection is enabled', () => {
		const remCollections = { font: false, primitives: true, spacing: false };
		
		expect(shouldUseRemForCollection(['primitives', 'size'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['base', 'primitives'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['primitives', 'spacing', 'unit'], remCollections)).toBe(true);
	});

	it('should return false for primitives variables when primitives collection is disabled', () => {
		const remCollections = { font: true, primitives: false, spacing: true };
		
		expect(shouldUseRemForCollection(['primitives', 'size'], remCollections)).toBe(false);
	});

	it('should return true for spacing variables when spacing collection is enabled', () => {
		const remCollections = { font: false, primitives: false, spacing: true };
		
		expect(shouldUseRemForCollection(['spacing', 'large'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['layout', 'spacing'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['spacing', 'margin', 'top'], remCollections)).toBe(true);
	});

	it('should return false for spacing variables when spacing collection is disabled', () => {
		const remCollections = { font: true, primitives: true, spacing: false };
		
		expect(shouldUseRemForCollection(['spacing', 'large'], remCollections)).toBe(false);
	});

	it('should handle custom collection names', () => {
		const remCollections = { myCustomCollection: true, anotherCollection: false };
		
		expect(shouldUseRemForCollection(['myCustomCollection', 'size'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['prefix', 'myCustomCollection'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['anotherCollection', 'size'], remCollections)).toBe(false);
		expect(shouldUseRemForCollection(['unknownCollection', 'size'], remCollections)).toBe(false);
	});

	it('should handle case insensitive matching', () => {
		const remCollections = { font: true, primitives: true, spacing: true };
		
		expect(shouldUseRemForCollection(['FONT', 'SIZE'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['Font', 'Size'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['PRIMITIVES'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['SPACING'], remCollections)).toBe(true);
	});

	it('should return true when any part of path matches enabled collection', () => {
		const remCollections = { font: true, primitives: false, spacing: false };
		
		expect(shouldUseRemForCollection(['design', 'font', 'heading'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['header', 'typography', 'size'], remCollections)).toBe(true);
	});

	it('should return false when no parts of path match any enabled collection', () => {
		const remCollections = { font: true, primitives: false, spacing: false };
		
		expect(shouldUseRemForCollection(['color', 'primary'], remCollections)).toBe(false);
		expect(shouldUseRemForCollection(['border', 'radius'], remCollections)).toBe(false);
		expect(shouldUseRemForCollection(['opacity', 'hover'], remCollections)).toBe(false);
	});

	it('should handle multiple enabled collections', () => {
		const remCollections = { font: true, primitives: true, spacing: true, custom: true };
		
		expect(shouldUseRemForCollection(['font', 'size'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['primitives', 'unit'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['spacing', 'large'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['custom', 'value'], remCollections)).toBe(true);
		expect(shouldUseRemForCollection(['color', 'primary'], remCollections)).toBe(false);
	});
});

describe('convertPxToRem', () => {
	it('should convert px values to rem using 16px base', () => {
		expect(convertPxToRem(16)).toBe('1rem');
		expect(convertPxToRem(32)).toBe('2rem');
		expect(convertPxToRem(8)).toBe('0.5rem');
		expect(convertPxToRem(24)).toBe('1.5rem');
	});

	it('should handle decimal px values', () => {
		expect(convertPxToRem(14)).toBe('0.875rem');
		expect(convertPxToRem(18)).toBe('1.125rem');
		expect(convertPxToRem(12)).toBe('0.75rem');
	});

	it('should round to max 3 decimal places', () => {
		expect(convertPxToRem(1)).toBe('0.063rem'); // 1/16 = 0.0625
		expect(convertPxToRem(3)).toBe('0.188rem'); // 3/16 = 0.1875
		expect(convertPxToRem(7)).toBe('0.438rem'); // 7/16 = 0.4375
	});

	it('should handle zero value', () => {
		expect(convertPxToRem(0)).toBe('0rem');
	});

	it('should handle negative values', () => {
		expect(convertPxToRem(-16)).toBe('-1rem');
		expect(convertPxToRem(-8)).toBe('-0.5rem');
	});

	it('should handle very small values', () => {
		expect(convertPxToRem(0.1)).toBe('0.006rem');
		expect(convertPxToRem(0.5)).toBe('0.031rem');
	});

	it('should handle large values', () => {
		expect(convertPxToRem(160)).toBe('10rem');
		expect(convertPxToRem(320)).toBe('20rem');
	});

	it('should handle values that result in exact decimal places', () => {
		expect(convertPxToRem(4)).toBe('0.25rem'); // 4/16 = 0.25
		expect(convertPxToRem(20)).toBe('1.25rem'); // 20/16 = 1.25
		expect(convertPxToRem(28)).toBe('1.75rem'); // 28/16 = 1.75
	});

	it('should handle edge cases with rounding', () => {
		expect(convertPxToRem(15.9999)).toBe('1rem'); // Should round to 1
		expect(convertPxToRem(16.0001)).toBe('1rem'); // Should round to 1
	});
});

describe('roundToMax3Decimals', () => {
	it('should round to max 3 decimal places', () => {
		expect(roundToMax3Decimals(1.2345)).toBe('1.235');
		expect(roundToMax3Decimals(1.2344)).toBe('1.234');
	});

	it('should return whole numbers as numbers', () => {
		expect(roundToMax3Decimals(5.0)).toBe(5);
		expect(roundToMax3Decimals(10)).toBe(10);
	});

	it('should handle numbers with fewer than 3 decimals', () => {
		expect(roundToMax3Decimals(1.5)).toBe('1.5');
		expect(roundToMax3Decimals(1.25)).toBe('1.25');
	});

	it('should handle very small numbers', () => {
		expect(roundToMax3Decimals(0.0001)).toBe(0);
		expect(roundToMax3Decimals(0.001)).toBe('0.001');
	});

	it('should handle negative numbers', () => {
		expect(roundToMax3Decimals(-1.2345)).toBe('-1.234');
		expect(roundToMax3Decimals(-5.0)).toBe(-5);
	});

	it('should handle edge cases', () => {
		expect(roundToMax3Decimals(0)).toBe(0);
		expect(roundToMax3Decimals(0.999)).toBe('0.999');
		expect(roundToMax3Decimals(0.9999)).toBe(1);
	});
});

describe('capitalizeFirstLetter', () => {
	it('should capitalize the first letter of a string', () => {
		expect(capitalizeFirstLetter('hello')).toBe('Hello');
		expect(capitalizeFirstLetter('world')).toBe('World');
		expect(capitalizeFirstLetter('test string')).toBe('Test string');
	});

	it('should handle strings that are already capitalized', () => {
		expect(capitalizeFirstLetter('Hello')).toBe('Hello');
		expect(capitalizeFirstLetter('HELLO')).toBe('HELLO');
	});

	it('should handle single character strings', () => {
		expect(capitalizeFirstLetter('a')).toBe('A');
		expect(capitalizeFirstLetter('A')).toBe('A');
	});

	it('should handle empty strings', () => {
		expect(capitalizeFirstLetter('')).toBe('');
	});

	it('should handle strings starting with numbers or symbols', () => {
		expect(capitalizeFirstLetter('1test')).toBe('1test');
		expect(capitalizeFirstLetter('!hello')).toBe('!hello');
		expect(capitalizeFirstLetter(' hello')).toBe(' hello');
	});

	it('should handle unicode characters', () => {
		expect(capitalizeFirstLetter('café')).toBe('Café');
		expect(capitalizeFirstLetter('ñoño')).toBe('Ñoño');
	});
}); 