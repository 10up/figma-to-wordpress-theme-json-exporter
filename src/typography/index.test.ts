import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
	getTypographyPresets, 
	formatFontPropertyPath, 
	formatStyleName,
	findFontFamilyVariable,
	findFontSizeVariable,
	findFontWeightVariable
} from './index';
import { mockFigma } from '../test-setup';

describe('Typography Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('formatFontPropertyPath', () => {
		it('should add font and property prefixes when neither exists', () => {
			const result = formatFontPropertyPath(['heading', 'large'], 'size');
			expect(result).toEqual(['font', 'size', 'heading', 'large']);
		});

		it('should add property prefix when only font prefix exists', () => {
			const result = formatFontPropertyPath(['font', 'heading', 'large'], 'size');
			expect(result).toEqual(['font', 'size', 'heading', 'large']);
		});

		it('should add font prefix when only property prefix exists', () => {
			const result = formatFontPropertyPath(['size', 'heading', 'large'], 'size');
			expect(result).toEqual(['font', 'size', 'heading', 'large']);
		});

		it('should not modify when both prefixes exist', () => {
			const result = formatFontPropertyPath(['font', 'size', 'heading', 'large'], 'size');
			expect(result).toEqual(['font', 'size', 'heading', 'large']);
		});

		it('should handle different property types', () => {
			const familyResult = formatFontPropertyPath(['heading'], 'family');
			expect(familyResult).toEqual(['font', 'family', 'heading']);

			const weightResult = formatFontPropertyPath(['heading'], 'weight');
			expect(weightResult).toEqual(['font', 'weight', 'heading']);
		});

		it('should convert parts to lowercase', () => {
			const result = formatFontPropertyPath(['HEADING', 'LARGE'], 'SIZE');
			expect(result).toEqual(['font', 'size', 'heading', 'large']);
		});
	});

	describe('formatStyleName', () => {
		it('should format basic style names', () => {
			expect(formatStyleName('heading-large')).toBe('Heading Large');
			expect(formatStyleName('body-text')).toBe('Body Text');
		});

		it('should handle size indicators', () => {
			expect(formatStyleName('text-xs')).toBe('Text XS');
			expect(formatStyleName('heading-2xl')).toBe('Heading 2XL');
			expect(formatStyleName('body-sm')).toBe('Body SM');
		});

		it('should handle mixed case', () => {
			expect(formatStyleName('headingLarge')).toBe('Heading Large');
			expect(formatStyleName('bodyText')).toBe('Body Text');
		});

		it('should handle single words', () => {
			expect(formatStyleName('heading')).toBe('Heading');
			expect(formatStyleName('xs')).toBe('XS');
		});
	});

	describe('findFontFamilyVariable', () => {
		it('should return WordPress preset for system fonts', async () => {
			expect(await findFontFamilyVariable('sans')).toBe('var(--wp--preset--font-family--sans)');
			expect(await findFontFamilyVariable('serif')).toBe('var(--wp--preset--font-family--serif)');
			expect(await findFontFamilyVariable('monospace')).toBe('var(--wp--preset--font-family--monospace)');
			expect(await findFontFamilyVariable('system')).toBe('var(--wp--preset--font-family--system)');
		});

		it('should find matching font family variable', async () => {
			const collections = [{
				id: 'collection1',
				name: 'Fonts',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			mockFigma.variables.getVariablesByCollectionIdAsync.mockResolvedValue([{
				id: 'var1',
				name: 'font/family/primary'
			}]);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				id: 'var1',
				valuesByMode: {
					mode1: 'Arial'
				}
			});

			const result = await findFontFamilyVariable('Arial');
			expect(result).toBe('var(--wp--custom--font--family--primary)');
		});

		it('should return custom WordPress preset for unknown fonts', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			const result = await findFontFamilyVariable('Custom Font');
			expect(result).toBe('var(--wp--preset--font-family--custom-font)');
		});

		it('should handle errors gracefully', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockRejectedValue(new Error('API Error'));

			const result = await findFontFamilyVariable('Arial');
			expect(result).toBe('var(--wp--preset--font-family--arial)');
		});
	});

	describe('findFontSizeVariable', () => {
		it('should find matching font size variable', async () => {
			const collections = [{
				id: 'collection1',
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			mockFigma.variables.getVariablesByCollectionIdAsync.mockResolvedValue([{
				id: 'var1',
				name: 'font/size/large'
			}]);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				id: 'var1',
				valuesByMode: {
					mode1: 24
				}
			});

			const result = await findFontSizeVariable(24);
			expect(result).toBe('var(--wp--custom--font--size--large)');
		});

		it('should return null when no match found', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			const result = await findFontSizeVariable(24);
			expect(result).toBeNull();
		});

		it('should handle errors gracefully', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockRejectedValue(new Error('API Error'));

			const result = await findFontSizeVariable(24);
			expect(result).toBeNull();
		});
	});

	describe('findFontWeightVariable', () => {
		it('should find matching font weight variable by value', async () => {
			const collections = [{
				id: 'collection1',
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			mockFigma.variables.getVariablesByCollectionIdAsync.mockResolvedValue([{
				id: 'var1',
				name: 'font/weight/bold'
			}]);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				id: 'var1',
				valuesByMode: {
					mode1: 700
				}
			});

			const result = await findFontWeightVariable(700);
			expect(result).toBe('var(--wp--custom--font--weight--bold)');
		});

		it('should find matching font weight variable by name', async () => {
			const collections = [{
				id: 'collection1',
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			mockFigma.variables.getVariablesByCollectionIdAsync.mockResolvedValue([{
				id: 'var1',
				name: 'font/weight/bold'
			}]);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				id: 'var1',
				valuesByMode: {
					mode1: 600 // Different value but name matches
				}
			});

			const result = await findFontWeightVariable(700); // 700 = bold
			expect(result).toBe('var(--wp--custom--font--weight--bold)');
		});

		it('should return null when no match found', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			const result = await findFontWeightVariable(700);
			expect(result).toBeNull();
		});

		it('should handle all weight name mappings', async () => {
			const weightMappings = [
				{ weight: 100, name: 'thin' },
				{ weight: 200, name: 'extra-light' },
				{ weight: 300, name: 'light' },
				{ weight: 400, name: 'regular' },
				{ weight: 500, name: 'medium' },
				{ weight: 600, name: 'semi-bold' },
				{ weight: 700, name: 'bold' },
				{ weight: 800, name: 'extra-bold' },
				{ weight: 900, name: 'black' }
			];

			for (const { weight, name } of weightMappings) {
				const collections = [{
					id: 'collection1',
					name: 'Typography',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}];

				mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
				mockFigma.variables.getVariablesByCollectionIdAsync.mockResolvedValue([{
					id: 'var1',
					name: `font/weight/${name}`
				}]);
				mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
					id: 'var1',
					valuesByMode: { mode1: 500 } // Different value to test name matching
				});

				const result = await findFontWeightVariable(weight);
				expect(result).toBe(`var(--wp--custom--font--weight--${name})`);

				vi.clearAllMocks();
			}
		});
	});

	describe('getTypographyPresets', () => {
		it('should return empty array when no text styles', async () => {
			mockFigma.getLocalTextStylesAsync.mockResolvedValue([]);

			const result = await getTypographyPresets();
			expect(result).toEqual([]);
		});

		it('should process basic text style', async () => {
			const textStyles = [{
				name: 'Heading 1',
				fontFamily: 'Arial',
				fontSize: 32,
				fontWeight: 700,
				lineHeight: { value: 120, unit: 'PERCENT' }
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result).toHaveLength(1);
			   expect(result[0]).toEqual({
    slug: 'heading-1',
    name: 'Heading 1',
    selector: 'h1',
    fontFamily: 'var(--wp--preset--font-family--arial)',
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: '1.2'
   });
		});

		it('should add selector for heading styles', async () => {
			const textStyles = [
				{ name: 'H1', fontFamily: 'Arial', fontSize: 32 },
				{ name: 'Heading 2', fontFamily: 'Arial', fontSize: 28 },
				{ name: 'heading-3', fontFamily: 'Arial', fontSize: 24 }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].selector).toBe('h1');
			expect(result[1].selector).toBe('h2');
			expect(result[2].selector).toBe('h3');
		});

		it('should handle bound variables for font family', async () => {
			const textStyles = [{
				name: 'Body Text',
				boundVariables: {
					fontFamily: { id: 'font-var-id' }
				}
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				name: 'font/family/primary'
			});

			const result = await getTypographyPresets();
			expect(result[0].fontFamily).toBeUndefined();
		});

		it('should handle bound variables for font size', async () => {
			const textStyles = [{
				name: 'Body Text',
				boundVariables: {
					fontSize: { id: 'size-var-id' }
				}
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				name: 'font/size/medium'
			});

			const result = await getTypographyPresets();
			expect(result[0].fontSize).toBeUndefined();
		});

		it('should handle fontName fallback', async () => {
			const textStyles = [{
				name: 'Body Text',
				fontName: { family: 'Helvetica' },
				fontSize: 16
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			const result = await getTypographyPresets();
			expect(result[0].fontFamily).toBe('var(--wp--preset--font-family--helvetica)');
			expect(result[0].fontSize).toBe('16px');
		});

		it('should handle line height conversion from percentage', async () => {
			const textStyles = [{
				name: 'Body Text',
				lineHeight: { value: 150, unit: 'PERCENT' }
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].lineHeight).toBe('1.5');
		});

		it('should handle line height as pixels', async () => {
			const textStyles = [{
				name: 'Body Text',
				fontSize: 16,
				lineHeight: { value: 24, unit: 'PIXELS' }
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].lineHeight).toBe('1.5'); // 24/16 = 1.5
		});

		it('should handle letter spacing conversion', async () => {
			const textStyles = [{
				name: 'Body Text',
				fontSize: 16,
				letterSpacing: { value: 0.5, unit: 'PIXELS' }
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].letterSpacing).toBe('0.031em'); // 0.5/16 = 0.03125
		});

		it('should handle text case transformations', async () => {
			const textStyles = [
				{ name: 'Upper', textCase: 'UPPER' },
				{ name: 'Lower', textCase: 'LOWER' },
				{ name: 'Title', textCase: 'TITLE' },
				{ name: 'Small Caps', textCase: 'SMALL_CAPS' }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].textTransform).toBe('uppercase');
			expect(result[1].textTransform).toBe('lowercase');
			expect(result[2].textTransform).toBe('capitalize');
			expect(result[3].textTransform).toBe('small-caps');
		});

		it('should handle text decoration', async () => {
			const textStyles = [
				{ name: 'Underline', textDecoration: 'UNDERLINE' },
				{ name: 'Strikethrough', textDecoration: 'STRIKETHROUGH' },
				{ name: 'None', textDecoration: 'NONE' }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].textDecoration).toBe('underline');
			expect(result[1].textDecoration).toBe('line-through');
			expect(result[2].textDecoration).toBeUndefined();
		});

		it('should handle text decoration color', async () => {
			const textStyles = [{
				name: 'Decorated',
				textDecorationColor: { r: 1, g: 0, b: 0 }
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].textDecorationColor).toBe('#ff0000');
		});

		it('should handle text decoration style', async () => {
			const textStyles = [
				{ name: 'Dashed', textDecorationStyle: 'DASHED' },
				{ name: 'Dotted', textDecorationStyle: 'DOTTED' },
				{ name: 'Wavy', textDecorationStyle: 'WAVY' },
				{ name: 'Solid', textDecorationStyle: 'SOLID' }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].textDecorationStyle).toBe('dashed');
			expect(result[1].textDecorationStyle).toBe('dotted');
			expect(result[2].textDecorationStyle).toBe('wavy');
			expect(result[3].textDecorationStyle).toBeUndefined(); // SOLID is default
		});

		it('should handle text decoration thickness', async () => {
			const textStyles = [
				{ name: 'Thick', textDecorationThickness: 2 },
				{ name: 'Object', textDecorationThickness: { value: 3 } }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].textDecorationThickness).toBe('2px');
			expect(result[1].textDecorationThickness).toBe('3px');
		});

		it('should handle hanging punctuation', async () => {
			const textStyles = [
				{ name: 'Hanging True', hangingPunctuation: true },
				{ name: 'Hanging False', hangingPunctuation: false }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].hangingPunctuation).toBe('first');
			expect(result[1].hangingPunctuation).toBe('none');
		});

		it('should handle leading trim', async () => {
			const textStyles = [
				{ name: 'None', leadingTrim: 'NONE' },
				{ name: 'Both', leadingTrim: 'BOTH' },
				{ name: 'Cap', leadingTrim: 'CAP' },
				{ name: 'Alphabetic', leadingTrim: 'ALPHABETIC' },
				{ name: 'Auto', leadingTrim: 'AUTO' }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].leadingTrim).toBe('none');
			expect(result[1].leadingTrim).toBe('both');
			expect(result[2].leadingTrim).toBe('start');
			expect(result[3].leadingTrim).toBe('end');
			expect(result[4].leadingTrim).toBeUndefined(); // AUTO is default
		});

		it('should omit invalid properties', async () => {
			const textStyles = [{
				name: 'Invalid',
				textDecorationColor: null,
				textDecorationThickness: 'invalid',
				lineHeight: null
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);

			const result = await getTypographyPresets();
			expect(result[0].textDecorationColor).toBeUndefined();
			expect(result[0].textDecorationThickness).toBeUndefined();
			expect(result[0].lineHeight).toBeUndefined();
		});

		it('should handle bound variables for all decoration properties', async () => {
			const textStyles = [{
				name: 'Bound Decoration',
				boundVariables: {
					textDecoration: { id: 'decoration-var' },
					textDecorationColor: { id: 'color-var' },
					textDecorationStyle: { id: 'style-var' },
					textDecorationThickness: { id: 'thickness-var' }
				}
			}];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(textStyles);
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({ name: 'decoration/type' })
				.mockResolvedValueOnce({ name: 'decoration/color' })
				.mockResolvedValueOnce({ name: 'decoration/style' })
				.mockResolvedValueOnce({ name: 'decoration/thickness' });

			const result = await getTypographyPresets();
			expect(result[0].textDecoration).toBeUndefined();
			expect(result[0].textDecorationColor).toBeUndefined();
			expect(result[0].textDecorationStyle).toBeUndefined();
			expect(result[0].textDecorationThickness).toBeUndefined();
		});
	});
}); 