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

		it('should handle variables without valuesByMode', async () => {
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
				valuesByMode: null
			});

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

		it('should handle font size variables without valuesByMode', async () => {
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
				valuesByMode: null
			});

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

		it('should handle errors gracefully', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockRejectedValue(new Error('API Error'));

			const result = await findFontWeightVariable(700);
			expect(result).toBeNull();
		});

		it('should handle variables without valuesByMode', async () => {
			const collections = [{
				id: 'collection1',
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			mockFigma.variables.getVariablesByCollectionIdAsync.mockResolvedValue([{
				id: 'var1',
				name: 'font/weight/medium' // Use a weight name that doesn't match 700 (bold)
			}]);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
				id: 'var1',
				valuesByMode: null
			});

			const result = await findFontWeightVariable(700);
			expect(result).toBeNull();
		});
	});

	describe('getTypographyPresets', () => {
		it('should process text styles and create typography presets', async () => {
			const mockTextStyles = [
				{
					name: 'Heading 1',
					fontFamily: 'Arial',
					fontSize: 32,
					fontWeight: 700,
					lineHeight: { value: 1.2, unit: 'PERCENT' },
					letterSpacing: { value: 0, unit: 'PERCENT' },
					textCase: 'UPPER',
					textDecoration: 'UNDERLINE',
					textDecorationColor: { r: 1, g: 0, b: 0 },
					textDecorationStyle: 'DASHED',
					textDecorationThickness: { value: 2 },
					textDecorationOffset: { value: 4 },
					textDecorationSkipInk: 'NONE',
					hangingPunctuation: true,
					leadingTrim: 'BOTH',
					boundVariables: {}
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			const result = await getTypographyPresets();

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				slug: 'heading-1',
				name: 'Heading 1',
				selector: 'h1',
				fontFamily: 'var(--wp--preset--font-family--arial)',
				fontSize: '32px',
				fontWeight: 700,
				lineHeight: '0.012',
				letterSpacing: 0,
				textTransform: 'uppercase',
				textDecoration: 'underline',
				textDecorationColor: '#ff0000',
				textDecorationStyle: 'dashed',
				textDecorationThickness: '2px',
				textUnderlineOffset: '4px',
				textDecorationSkipInk: 'none',
				hangingPunctuation: 'first',
				leadingTrim: 'both'
			});
		});

		it('should handle bound variables for font properties', async () => {
			// Reset all mocks to ensure clean state
			vi.clearAllMocks();
			
			const mockTextStyles = [
				{
					name: 'Body Text',
					fontFamily: 'Arial', // Add actual values to trigger the bound variable logic
					fontSize: 16,
					fontWeight: 400,
					lineHeight: 1.5,
					letterSpacing: 0,
					boundVariables: {
						fontFamily: { id: 'font-family-var' },
						fontSize: { id: 'font-size-var' },
						fontWeight: { id: 'font-weight-var' },
						lineHeight: { id: 'line-height-var' },
						letterSpacing: { id: 'letter-spacing-var' }
					}
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);
			// Mock the variables in the order they are processed: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({ name: 'font/family/primary' })
				.mockResolvedValueOnce({ name: 'font/size/body' })
				.mockResolvedValueOnce({ name: 'font/weight/normal' })
				.mockResolvedValueOnce({ name: 'font/line-height/normal' })
				.mockResolvedValueOnce({ name: 'font/letter-spacing/normal' });

			const result = await getTypographyPresets();

			expect(result[0]).toMatchObject({
				name: 'Body Text',
				slug: 'body-text',
				fontFamily: 'var(--wp--custom--font--family--primary)',
				fontSize: 'var(--wp--custom--font--size--body)',
				fontWeight: 'var(--wp--custom--font--weight--normal)',
				lineHeight: 'var(--wp--custom--font--line-height--normal)',
				letterSpacing: 'var(--wp--custom--font--letter-spacing--normal)'
			});
		});

		it('should handle fontName fallback when fontFamily is not available', async () => {
			const mockTextStyles = [
				{
					name: 'Test Style',
					fontName: { family: 'Helvetica', style: 'Bold' }
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0]).toMatchObject({
				fontFamily: 'var(--wp--preset--font-family--helvetica)',
				fontWeight: 700
			});
		});

		it('should handle various font weight mappings from fontName.style', async () => {
			const mockTextStyles = [
				{ name: 'Thin', fontName: { style: 'Thin' } },
				{ name: 'Light', fontName: { style: 'Light' } },
				{ name: 'Regular', fontName: { style: 'Regular' } },
				{ name: 'Medium', fontName: { style: 'Medium' } },
				{ name: 'SemiBold', fontName: { style: 'SemiBold' } },
				{ name: 'Bold', fontName: { style: 'Bold' } },
				{ name: 'Black', fontName: { style: 'Black' } },
				{ name: 'Numeric', fontName: { style: '600' } }
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].fontWeight).toBe(100); // Thin
			expect(result[1].fontWeight).toBe(300); // Light
			expect(result[2].fontWeight).toBe(400); // Regular
			expect(result[3].fontWeight).toBe(500); // Medium
			expect(result[4].fontWeight).toBe(600); // SemiBold
			expect(result[5].fontWeight).toBe(700); // Bold
			expect(result[6].fontWeight).toBe(900); // Black
			expect(result[7].fontWeight).toBe(600); // Numeric
		});

		it('should handle different lineHeight formats', async () => {
			const mockTextStyles = [
				{
					name: 'Percent',
					lineHeight: { value: 120, unit: 'PERCENT' },
					fontSize: 16
				},
				{
					name: 'Pixels',
					lineHeight: { value: 24, unit: 'PIXELS' },
					fontSize: 16
				},
				{
					name: 'Number',
					lineHeight: 1.5
				},
				{
					name: 'String Px',
					lineHeight: '20px',
					fontSize: 16
				},
				{
					name: 'String Percent',
					lineHeight: '150%'
				},
				{
					name: 'String Number',
					lineHeight: '1.4'
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].lineHeight).toBe('1.2'); // 120% -> 1.2
			expect(result[1].lineHeight).toBe('1.5'); // 24px / 16px -> 1.5
			expect(result[2].lineHeight).toBe('1.5'); // Direct number
			expect(result[3].lineHeight).toBe('1.25'); // 20px / 16px -> 1.25
			expect(result[4].lineHeight).toBe('1.5'); // 150% -> 1.5
			expect(result[5].lineHeight).toBe('1.4'); // Direct string number
		});

		it('should handle different letterSpacing formats', async () => {
			const mockTextStyles = [
				{
					name: 'Zero Percent',
					letterSpacing: { value: 0, unit: 'PERCENT' },
					fontSize: 16
				},
				{
					name: 'Pixels',
					letterSpacing: { value: 2, unit: 'PIXELS' },
					fontSize: 16
				},
				{
					name: 'Number',
					letterSpacing: 0.5
				},
				{
					name: 'String Px',
					letterSpacing: '1px',
					fontSize: 16
				},
				{
					name: 'String Number',
					letterSpacing: '0.25'
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].letterSpacing).toBe(0); // 0% -> 0
			expect(result[1].letterSpacing).toBe('0.125em'); // 2px / 16px -> 0.125em
			expect(result[2].letterSpacing).toBe('0.5'); // Direct number as string
			expect(result[3].letterSpacing).toBe('0.063em'); // 1px / 16px -> 0.063em
			expect(result[4].letterSpacing).toBe('0.25'); // Direct string number
		});

		it('should handle text decoration properties with bound variables', async () => {
			// Reset all mocks to ensure clean state
			vi.clearAllMocks();
			
			const mockTextStyles = [
				{
					name: 'Decorated',
					textCase: 'TITLE',
					textDecoration: 'STRIKETHROUGH',
					textDecorationColor: { r: 0, g: 1, b: 0 },
					textDecorationStyle: 'DOTTED',
					textDecorationThickness: 3,
					textDecorationOffset: 2,
					textDecorationSkipInk: 'ALL',
					hangingPunctuation: false,
					leadingTrim: 'CAP',
					boundVariables: {
						textCase: { id: 'text-case-var' },
						textDecoration: { id: 'text-decoration-var' },
						textDecorationColor: { id: 'text-decoration-color-var' },
						textDecorationStyle: { id: 'text-decoration-style-var' },
						textDecorationThickness: { id: 'text-decoration-thickness-var' },
						textDecorationOffset: { id: 'text-decoration-offset-var' },
						textDecorationSkipInk: { id: 'text-decoration-skip-ink-var' },
						hangingPunctuation: { id: 'hanging-punctuation-var' },
						leadingTrim: { id: 'leading-trim-var' }
					}
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);
			// Mock the variables in the order they are processed: textCase, textDecoration, textDecorationColor, textDecorationStyle, textDecorationThickness, textDecorationOffset, textDecorationSkipInk, hangingPunctuation, leadingTrim
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({ name: 'text/case' })
				.mockResolvedValueOnce({ name: 'text/decoration' })
				.mockResolvedValueOnce({ name: 'text/decoration-color' })
				.mockResolvedValueOnce({ name: 'text/decoration-style' })
				.mockResolvedValueOnce({ name: 'text/decoration-thickness' })
				.mockResolvedValueOnce({ name: 'text/decoration-offset' })
				.mockResolvedValueOnce({ name: 'text/decoration-skip-ink' })
				.mockResolvedValueOnce({ name: 'text/hanging-punctuation' })
				.mockResolvedValueOnce({ name: 'text/leading-trim' });

			const result = await getTypographyPresets();

			expect(result[0]).toMatchObject({
				textTransform: 'var(--wp--custom--text--case)',
				textDecoration: 'var(--wp--custom--text--decoration)',
				textDecorationColor: 'var(--wp--custom--text--decoration-color)',
				textDecorationStyle: 'var(--wp--custom--text--decoration-style)',
				textDecorationThickness: 'var(--wp--custom--text--decoration-thickness)',
				textUnderlineOffset: 'var(--wp--custom--text--decoration-offset)',
				textDecorationSkipInk: 'var(--wp--custom--text--decoration-skip-ink)',
				hangingPunctuation: 'var(--wp--custom--text--hanging-punctuation)',
				leadingTrim: 'var(--wp--custom--text--leading-trim)'
			});
		});

		it('should handle edge cases and undefined values', async () => {
			const mockTextStyles = [
				{
					name: 'Edge Case',
					textCase: 'ORIGINAL',
					textDecoration: 'NONE',
					textDecorationStyle: 'SOLID',
					textDecorationSkipInk: 'AUTO',
					leadingTrim: 'AUTO',
					textDecorationThickness: null,
					textDecorationOffset: undefined,
					lineHeight: { value: null, unit: 'PERCENT' }
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			// These properties should not be set when they have default/undefined values
			expect(result[0]).not.toHaveProperty('textTransform');
			expect(result[0]).not.toHaveProperty('textDecoration');
			expect(result[0]).not.toHaveProperty('textDecorationStyle');
			expect(result[0]).not.toHaveProperty('textDecorationSkipInk');
			expect(result[0]).not.toHaveProperty('leadingTrim');
			expect(result[0]).not.toHaveProperty('textDecorationThickness');
			expect(result[0]).not.toHaveProperty('textUnderlineOffset');
			expect(result[0].lineHeight).toBe('normal');
		});

		it('should handle string textDecorationColor', async () => {
			const mockTextStyles = [
				{
					name: 'String Color',
					textDecoration: 'UNDERLINE',
					textDecorationColor: '#ff0000'
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].textDecorationColor).toBe('#ff0000');
		});

		it('should handle invalid textDecorationThickness object', async () => {
			const mockTextStyles = [
				{
					name: 'Invalid Thickness',
					textDecoration: 'UNDERLINE',
					textDecorationThickness: { invalidProperty: 'test' }
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0]).not.toHaveProperty('textDecorationThickness');
		});

		it('should handle invalid textDecorationOffset object', async () => {
			const mockTextStyles = [
				{
					name: 'Invalid Offset',
					textDecoration: 'UNDERLINE',
					textDecorationOffset: { invalidProperty: 'test' }
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0]).not.toHaveProperty('textUnderlineOffset');
		});

		it('should handle font family variables without valuesByMode', async () => {
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
				valuesByMode: null
			});

			const result = await findFontFamilyVariable('Arial');
			expect(result).toBe('var(--wp--preset--font-family--arial)');
		});

		it('should handle letterSpacing edge cases', async () => {
			const mockTextStyles = [
				{
					name: 'Null Letter Spacing',
					letterSpacing: { value: null, unit: 'PIXELS' },
					fontSize: 16
				},
				{
					name: 'Zero Letter Spacing',
					letterSpacing: { value: 0, unit: 'PERCENT' },
					fontSize: 16
				},
				{
					name: 'String Letter Spacing',
					letterSpacing: '1.5'
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].letterSpacing).toBe(0); // null value should fallback to 0
			expect(result[1].letterSpacing).toBe(0); // 0% should be 0
			expect(result[2].letterSpacing).toBe('1.5'); // string number should be preserved
		});

		it('should handle textDecorationColor as null', async () => {
			const mockTextStyles = [
				{
					name: 'Null Color',
					textDecoration: 'UNDERLINE',
					textDecorationColor: null
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0]).not.toHaveProperty('textDecorationColor');
		});

		it('should handle numeric textDecorationThickness and textDecorationOffset', async () => {
			const mockTextStyles = [
				{
					name: 'Numeric Values',
					textDecoration: 'UNDERLINE',
					textDecorationThickness: 2,
					textDecorationOffset: 4
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].textDecorationThickness).toBe('2px');
			expect(result[0].textUnderlineOffset).toBe('4px');
		});

		it('should handle lineHeight with null value fallback', async () => {
			const mockTextStyles = [
				{
					name: 'Null Line Height',
					lineHeight: { value: null, unit: 'PIXELS' },
					fontSize: 16
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].lineHeight).toBe('normal'); // Should fallback to 'normal'
		});

		it('should handle lineHeight with other units', async () => {
			const mockTextStyles = [
				{
					name: 'Other Unit Line Height',
					lineHeight: { value: 1.5, unit: 'OTHER' },
					fontSize: 16
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].lineHeight).toBe('1.5'); // Should use raw value for other units
		});

		it('should handle letterSpacing with other units', async () => {
			const mockTextStyles = [
				{
					name: 'Other Unit Letter Spacing',
					letterSpacing: { value: 0.5, unit: 'OTHER' },
					fontSize: 16
				}
			];

			mockFigma.getLocalTextStylesAsync.mockResolvedValue(mockTextStyles);

			const result = await getTypographyPresets();

			expect(result[0].letterSpacing).toBe('0.5'); // Should use raw value for other units
		});
	});
}); 