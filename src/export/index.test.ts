import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToJSON } from './index';
import { mockFigma } from '../test-setup';

describe('Export Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('exportToJSON', () => {
		it('should export with default options and no collections', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			await exportToJSON();

			expect(mockFigma.ui.postMessage).toHaveBeenCalledWith({
				type: "EXPORT_RESULT",
				files: [{
					fileName: "theme.json",
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"settings": {
							"custom": {}
						}
					}
				}]
			});
		});

		it('should use provided base theme', async () => {
			const baseTheme = {
				"$schema": "https://schemas.wp.org/trunk/theme.json",
				"version": 3,
				"settings": {
					"custom": {
						"existing": "value"
					}
				}
			};

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			await exportToJSON({ baseTheme });

			expect(mockFigma.ui.postMessage).toHaveBeenCalledWith({
				type: "EXPORT_RESULT",
				files: [{
					fileName: "theme.json",
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"settings": {
							"custom": {
								"existing": "value"
							}
						}
					}
				}]
			});
		});

		it('should process primitives collection first', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['color-var']
				},
				{
					name: 'Primitives',
					modes: [{ modeId: 'mode2', name: 'Default' }],
					variableIds: ['primitive-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock primitive variable
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/base',
					resolvedType: 'FLOAT',
					valuesByMode: { mode2: 16 }
				})
				// Mock color variable
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: { mode1: { r: 1, g: 0, b: 0 } }
				});

			await exportToJSON();

			expect(mockFigma.ui.postMessage).toHaveBeenCalledWith({
				type: "EXPORT_RESULT",
				files: [{
					fileName: "theme.json",
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"settings": {
							"custom": {
								"spacing": {
									"base": "16px"
								},
								"color": {
									"color": {
										"primary": "#ff0000"
									}
								}
							}
						}
					}
				}]
			});
		});

		it('should handle color collection with multiple modes', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [
						{ modeId: 'light', name: 'Light' },
						{ modeId: 'dark', name: 'Dark' }
					],
					variableIds: ['color-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock color variable for both modes
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: { 
						light: { r: 1, g: 0, b: 0 },
						dark: { r: 0, g: 1, b: 0 }
					}
				});

			await exportToJSON();

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files).toHaveLength(3); // Main theme + 2 section files
			
			// Check main theme
			expect(call.files[0].fileName).toBe("theme.json");
			expect(call.files[0].body.settings.custom.color).toEqual({
				color: { primary: "#ff0000" }
			});

			// Check section files
			expect(call.files[1].fileName).toBe("styles/section-light.json");
			expect(call.files[1].body.title).toBe("Light");
			expect(call.files[1].body.slug).toBe("section-light");

			expect(call.files[2].fileName).toBe("styles/section-dark.json");
			expect(call.files[2].body.title).toBe("Dark");
			expect(call.files[2].body.slug).toBe("section-dark");
		});

		it('should handle color collection with button styles', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['button-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock button variable
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'button/primary/default/background',
					resolvedType: 'COLOR',
					valuesByMode: { mode1: { r: 1, g: 0, b: 0 } }
				});

			await exportToJSON();

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files).toHaveLength(1); // Just main theme (no button variants without primary)
			
			expect(call.files[0].body.settings.custom.color).toEqual({
				button: {
					primary: {
						default: {
							background: "#ff0000"
						}
					}
				}
			});
		});

		it('should handle color collection with multiple modes and button styles in additional modes', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [
						{ modeId: 'light', name: 'Light' },
						{ modeId: 'dark', name: 'Dark' }
					],
					variableIds: ['button-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock button variable for both modes
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'button/primary/default/background',
					resolvedType: 'COLOR',
					valuesByMode: { 
						light: { r: 1, g: 0, b: 0 },
						dark: { r: 0, g: 1, b: 0 }
					}
				});

			await exportToJSON();

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files).toHaveLength(3); // Main theme + 2 section files
			
			// Check that button styles are processed for both modes
			expect(call.files[0].body.settings.custom.color).toEqual({
				button: {
					primary: {
						default: {
							background: "#ff0000"
						}
					}
				}
			});

			// Check section files have button data
			expect(call.files[1].body.settings.custom.color).toEqual({
				button: {
					primary: {
						default: {
							background: "#ff0000"
						}
					}
				}
			});

			expect(call.files[2].body.settings.custom.color).toEqual({
				button: {
					primary: {
						default: {
							background: "#00ff00"
						}
					}
				}
			});
		});

		it('should handle regular collection (non-color, non-primitives)', async () => {
			const collections = [
				{
					name: 'Spacing',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['spacing-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/large',
					resolvedType: 'FLOAT',
					valuesByMode: { mode1: 24 }
				});

			await exportToJSON();

			expect(mockFigma.ui.postMessage).toHaveBeenCalledWith({
				type: "EXPORT_RESULT",
				files: [{
					fileName: "theme.json",
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"settings": {
							"custom": {
								"spacing": {
									"spacing": {
										"large": "24px"
									}
								}
							}
						}
					}
				}]
			});
		});

		it('should generate typography presets when requested', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
			mockFigma.getLocalTextStylesAsync.mockResolvedValue([
				{
					name: 'Heading 1',
					fontFamily: 'Arial',
					fontSize: 32,
					fontWeight: 700,
					lineHeight: { value: 1.2, unit: 'PERCENT' }
				}
			]);

			await exportToJSON({ generateTypography: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.custom.typography).toBeDefined();
			expect(call.files[0].body.settings.custom.typography.presets).toHaveLength(1);
		});

		it('should handle color collection with single mode', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['color-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: { mode1: { r: 1, g: 0, b: 0 } }
				});

			await exportToJSON();

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files).toHaveLength(2); // Main theme + 1 section file
			
			expect(call.files[0].body.settings.custom.color).toEqual({
				color: { primary: "#ff0000" }
			});
			
			expect(call.files[1].fileName).toBe("styles/section-default.json");
		});

		it('should handle mode names with spaces', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [
						{ modeId: 'mode1', name: 'Light Mode' },
						{ modeId: 'mode2', name: 'Dark Mode' }
					],
					variableIds: ['color-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: { 
						mode1: { r: 1, g: 0, b: 0 },
						mode2: { r: 0, g: 1, b: 0 }
					}
				});

			await exportToJSON();

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[1].fileName).toBe("styles/section-light-mode.json");
			expect(call.files[2].fileName).toBe("styles/section-dark-mode.json");
		});

		it('should ensure theme structure exists even with base theme', async () => {
			const baseTheme = {
				"version": 3
				// Missing settings structure
			};

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			await exportToJSON({ baseTheme });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings).toBeDefined();
			expect(call.files[0].body.settings.custom).toBeDefined();
		});

		it('should handle empty typography presets', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
			mockFigma.getLocalTextStylesAsync.mockResolvedValue([]);

			await exportToJSON({ generateTypography: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.custom.typography).toBeUndefined();
		});

		it('should generate color presets when requested', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['color-var1', 'color-var2']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock the variables for both the main export and color presets
			// The export function will call getVariableByIdAsync multiple times
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'primary',
					resolvedType: 'COLOR',
					valuesByMode: { mode1: { r: 1, g: 0, b: 0, a: 1 } }
				});

			await exportToJSON({ generateColorPresets: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.color).toBeDefined();
			expect(call.files[0].body.settings.color.palette).toHaveLength(2);
			expect(call.files[0].body.settings.color.palette[0]).toEqual({
				name: 'Primary',
				slug: 'primary',
				color: 'var(--wp--custom--color--primary)'
			});
		});

		it('should handle empty color presets', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			await exportToJSON({ generateColorPresets: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.color).toBeUndefined();
		});

		it('should generate color presets with variable aliases', async () => {
			const collections = [
				{
					name: 'Primitives',
					modes: [{ modeId: 'prim', name: 'Default' }],
					variableIds: ['prim-var']
				},
				{
					name: 'Color',
					modes: [{ modeId: 'color', name: 'Default' }],
					variableIds: ['color-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock the primitive variable (referenced by alias)
			const primVariable = {
				name: 'primitives/blue/500',
				resolvedType: 'COLOR',
				valuesByMode: { prim: { r: 0.2, g: 0.4, b: 0.8, a: 1 } }
			};

			// Mock the color variable (alias to primitive)
			const colorVariable = {
				name: 'primary',
				resolvedType: 'COLOR',
				valuesByMode: { color: { type: 'VARIABLE_ALIAS', id: 'prim-var' } }
			};

			mockFigma.variables.getVariableByIdAsync
				.mockImplementation((id: string) => {
					if (id === 'prim-var') return Promise.resolve(primVariable);
					if (id === 'color-var') return Promise.resolve(colorVariable);
					return Promise.resolve(null);
				});

			await exportToJSON({ generateColorPresets: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.color).toBeDefined();
			expect(call.files[0].body.settings.color.palette).toHaveLength(1);
			expect(call.files[0].body.settings.color.palette[0]).toEqual({
				name: 'Primary',
				slug: 'primary',
				color: 'var(--wp--custom--color--primary)'
			});
		});

		it('should handle multiple collections of different types', async () => {
			const collections = [
				{
					name: 'Primitives',
					modes: [{ modeId: 'prim', name: 'Default' }],
					variableIds: ['prim-var']
				},
				{
					name: 'Color',
					modes: [{ modeId: 'color', name: 'Default' }],
					variableIds: ['color-var']
				},
				{
					name: 'Spacing',
					modes: [{ modeId: 'space', name: 'Default' }],
					variableIds: ['space-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'base/unit',
					resolvedType: 'FLOAT',
					valuesByMode: { prim: 8 }
				})
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: { color: { r: 1, g: 0, b: 0 } }
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT',
					valuesByMode: { space: 24 }
				});

			await exportToJSON();

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files).toHaveLength(2); // Main theme + color section
			
			const customSettings = call.files[0].body.settings.custom;
			expect(customSettings.base).toBeDefined(); // From primitives
			expect(customSettings.color).toBeDefined(); // From color collection
			expect(customSettings.spacing).toBeDefined(); // From spacing collection
		});

		it('should pass rem conversion options to collection processing and generate rem values', async () => {
			const collections = [
				{
					name: 'Typography',
					modes: [{ modeId: 'typo', name: 'Default' }],
					variableIds: ['font-var']
				},
				{
					name: 'Spacing',
					modes: [{ modeId: 'space', name: 'Default' }],
					variableIds: ['space-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'font/size/large',
					resolvedType: 'FLOAT',
					valuesByMode: { typo: 32 }
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT',
					valuesByMode: { space: 24 }
				});

			const options = {
				useRem: true,
				remCollections: { font: true, primitives: false, spacing: false }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			const customSettings = call.files[0].body.settings.custom;
			
			// Font variable should use rem
			expect(customSettings.typography.font.size.large).toBe('2rem'); // 32px = 2rem
			// Spacing variable should use px (not enabled for rem)
			expect(customSettings.spacing.spacing.large).toBe('24px');
		});

		it('should pass rem conversion options to typography presets', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
			mockFigma.getLocalTextStylesAsync.mockResolvedValue([
				{
					name: 'Heading 1',
					fontFamily: 'Arial',
					fontSize: 32,
					fontWeight: 700
				}
			]);

			const options = {
				generateTypography: true,
				useRem: true,
				remCollections: { font: true, primitives: false, spacing: false }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.custom.typography).toBeDefined();
			expect(call.files[0].body.settings.custom.typography.presets).toHaveLength(1);
			expect(call.files[0].body.settings.custom.typography.presets[0].fontSize).toBe('2rem'); // 32px = 2rem
		});

		it('should not use rem when rem conversion is disabled in options', async () => {
			const collections = [
				{
					name: 'Typography',
					modes: [{ modeId: 'typo', name: 'Default' }],
					variableIds: ['font-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'font/size/large',
					resolvedType: 'FLOAT',
					valuesByMode: { typo: 32 }
				});

			const options = {
				useRem: false,
				remCollections: { font: true, primitives: true, spacing: true }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			const customSettings = call.files[0].body.settings.custom;
			
			// Font variable should use px when rem is disabled
			expect(customSettings.typography.font.size.large).toBe('32px');
		});

		it('should handle rem conversion with primitives collection', async () => {
			const collections = [
				{
					name: 'Primitives',
					modes: [{ modeId: 'prim', name: 'Default' }],
					variableIds: ['prim-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'primitives/size/unit',
					resolvedType: 'FLOAT',
					valuesByMode: { prim: 8 }
				});

			const options = {
				useRem: true,
				remCollections: { font: false, primitives: true, spacing: false }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			const customSettings = call.files[0].body.settings.custom;
			
			// Primitives variable should use rem
			expect(customSettings.primitives.size.unit).toBe('0.5rem'); // 8px = 0.5rem
		});

		it('should handle rem conversion with spacing collection', async () => {
			const collections = [
				{
					name: 'Spacing',
					modes: [{ modeId: 'space', name: 'Default' }],
					variableIds: ['space-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT',
					valuesByMode: { space: 32 }
				});

			const options = {
				useRem: true,
				remCollections: { font: false, primitives: false, spacing: true }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			const customSettings = call.files[0].body.settings.custom;
			
			// Spacing variable should use rem
			expect(customSettings.spacing.spacing.large).toBe('2rem'); // 32px = 2rem
		});

		it('should handle rem conversion with fluid collections', async () => {
			const collections = [
				{
					name: 'Fluid Spacing',
					modes: [
						{ modeId: 'desktop', name: 'Desktop' },
						{ modeId: 'mobile', name: 'Mobile' }
					],
					variableIds: ['fluid-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: { 
						desktop: 32,
						mobile: 16
					}
				});

			const options = {
				useRem: true,
				remCollections: { font: false, primitives: false, spacing: true }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			const customSettings = call.files[0].body.settings.custom;
			
			// Fluid spacing variable should use rem for both min and max
			// The collection name "Fluid Spacing" becomes "fluid spacing" when lowercased
			expect(customSettings['fluid spacing'].spacing.responsive).toEqual({
				fluid: 'true',
				min: '1rem',  // 16px = 1rem
				max: '2rem'   // 32px = 2rem
			});
		});

		it('should not affect color variables with rem conversion enabled', async () => {
			const collections = [
				{
					name: 'Color',
					modes: [{ modeId: 'color', name: 'Default' }],
					variableIds: ['color-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: { color: { r: 1, g: 0, b: 0 } }
				});

			const options = {
				useRem: true,
				remCollections: { font: true, primitives: true, spacing: true }
			};

			await exportToJSON(options);

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			const customSettings = call.files[0].body.settings.custom;
			
			// Color variable should remain unchanged (hex value)
			expect(customSettings.color.color.primary).toBe('#ff0000');
		});

		it('should generate spacing presets when requested', async () => {
			const collections = [
				{
					name: 'Spacing',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['spacing-var1', 'spacing-var2']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			// Mock the variables for both the main export and spacing presets
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/base',
					resolvedType: 'FLOAT',
					valuesByMode: { mode1: 16 }
				});

			await exportToJSON({ generateSpacingPresets: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.spacing).toBeDefined();
			expect(call.files[0].body.settings.spacing.spacingSizes).toHaveLength(2);
			expect(call.files[0].body.settings.spacing.spacingSizes[0]).toEqual({
				name: 'Base',
				slug: 'base',
				size: 'var(--wp--custom--spacing--base)'
			});
		});

		it('should handle empty spacing presets', async () => {
			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);

			await exportToJSON({ generateSpacingPresets: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.spacing).toBeUndefined();
		});

		it('should generate spacing presets from Spacing and Primitives collections only', async () => {
			const collections = [
				{
					name: 'Primitives',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['spacing-var', 'color-var']
				},
				{
					name: 'Spacing',
					modes: [{ modeId: 'mode2', name: 'Default' }],
					variableIds: ['base-var']
				},
				{
					name: 'Layout',
					modes: [{ modeId: 'mode3', name: 'Default' }],
					variableIds: ['gap-var']
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(collections);
			
			mockFigma.variables.getVariableByIdAsync
				.mockImplementation((id: string) => {
					if (id === 'spacing-var') {
						return Promise.resolve({
							name: 'spacing/primitive',
							resolvedType: 'FLOAT',
							valuesByMode: { mode1: 8 }
						});
					}
					if (id === 'color-var') {
						return Promise.resolve({
							name: 'color/primary',
							resolvedType: 'FLOAT',
							valuesByMode: { mode1: 255 }
						});
					}
					if (id === 'base-var') {
						return Promise.resolve({
							name: 'base',
							resolvedType: 'FLOAT',
							valuesByMode: { mode2: 16 }
						});
					}
					if (id === 'gap-var') {
						return Promise.resolve({
							name: 'gap/large',
							resolvedType: 'FLOAT',
							valuesByMode: { mode3: 24 }
						});
					}
					return Promise.resolve(null);
				});

			await exportToJSON({ generateSpacingPresets: true });

			const call = mockFigma.ui.postMessage.mock.calls[0][0];
			expect(call.files[0].body.settings.spacing).toBeDefined();
			expect(call.files[0].body.settings.spacing.spacingSizes).toHaveLength(2);
			
			const spacingSizes = call.files[0].body.settings.spacing.spacingSizes;
			expect(spacingSizes.map((s: any) => s.name)).toEqual(['Base', 'Primitive']);
			expect(spacingSizes.map((s: any) => s.size)).toEqual([
				'var(--wp--custom--spacing--base)',
				'var(--wp--custom--spacing--primitive)'
			]);
		});
	});
}); 