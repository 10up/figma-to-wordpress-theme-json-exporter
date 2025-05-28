import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processCollectionData, processCollectionModeData } from './index';
import { mockFigma } from '../test-setup';

describe('Collection Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('processCollectionModeData', () => {
		it('should process variables for a specific mode', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			// Mock variable data
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { r: 1, g: 0, b: 0 }
					}
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT',
					valuesByMode: {
						mode1: 24
					}
				});

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				},
				spacing: {
					large: '24px'
				}
			});
		});

		it('should handle variable aliases', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			// Mock variable with alias
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/secondary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { type: 'VARIABLE_ALIAS', id: 'ref-var' }
					}
				})
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR'
				});

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({
				color: {
					secondary: 'var(--wp--custom--color--primary)'
				}
			});
		});

		it('should skip variables that are null', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { r: 1, g: 0, b: 0 }
					}
				});

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				}
			});
		});

		it('should skip variables with undefined values', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: undefined
					}
				});

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({});
		});

		it('should skip variables with unsupported types', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'text/content',
					resolvedType: 'STRING',
					valuesByMode: {
						mode1: 'Hello World'
					}
				});

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({});
		});

		it('should handle nested variable names', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/button/primary/background',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { r: 0, g: 0, b: 1 }
					}
				});

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({
				color: {
					button: {
						primary: {
							background: '#0000ff'
						}
					}
				}
			});
		});
	});

	describe('processCollectionData', () => {
		it('should process regular collection with single mode', async () => {
			const collection = {
				name: 'Regular Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { r: 1, g: 0, b: 0 }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				}
			});
		});

		it('should process fluid collection with Desktop and Mobile modes', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/large',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 32,
						mobile: 16
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					large: {
						fluid: 'true',
						min: '16px',
						max: '32px'
					}
				}
			});
		});

		it('should handle fluid collection with same values for desktop and mobile', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/base',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 16,
						mobile: 16
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					base: '16px'
				}
			});
		});

		it('should handle fluid collection with variable aliases for both modes', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'desktop-ref' },
						mobile: { type: 'VARIABLE_ALIAS', id: 'mobile-ref' }
					}
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT'
				})
				.mockResolvedValueOnce({
					name: 'spacing/small',
					resolvedType: 'FLOAT'
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					responsive: {
						fluid: 'true',
						min: 'var(--wp--custom--spacing--small)',
						max: 'var(--wp--custom--spacing--large)'
					}
				}
			});
		});

		it('should handle fluid collection with same variable aliases', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/consistent',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'base-ref' },
						mobile: { type: 'VARIABLE_ALIAS', id: 'base-ref' }
					}
				})
				.mockResolvedValueOnce({
					name: 'spacing/base',
					resolvedType: 'FLOAT'
				})
				.mockResolvedValueOnce({
					name: 'spacing/base',
					resolvedType: 'FLOAT'
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					consistent: 'var(--wp--custom--spacing--base)'
				}
			});
		});

		it('should handle fluid collection with one alias and one direct value', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/mixed',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'large-ref' },
						mobile: 16
					}
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT'
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					mixed: 'var(--wp--custom--spacing--large)'
				}
			});
		});

		it('should handle fluid collection with mobile alias and desktop direct value', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/mixed2',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 32,
						mobile: { type: 'VARIABLE_ALIAS', id: 'small-ref' }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					mixed2: '32px'
				}
			});
		});

		it('should fallback to first mode if desktop/mobile not found in fluid collection', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'mode1', name: 'Light' },
					{ modeId: 'mode2', name: 'Dark' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { r: 1, g: 0, b: 0 }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				}
			});
		});

		it('should skip variables with undefined values in fluid collection', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/undefined',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: undefined,
						mobile: 16
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({});
		});

		it('should skip variables with unsupported types in fluid collection', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'text/content',
					resolvedType: 'STRING',
					valuesByMode: {
						desktop: 'Desktop Text',
						mobile: 'Mobile Text'
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({});
		});

		it('should handle null variables in fluid collection', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1', 'var2']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					name: 'spacing/valid',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 32,
						mobile: 16
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					valid: {
						fluid: 'true',
						min: '16px',
						max: '32px'
					}
				}
			});
		});

		it('should handle case insensitive desktop/mobile mode names', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'DESKTOP' },
					{ modeId: 'mobile', name: 'mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValue({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 32,
						mobile: 16
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					responsive: {
						fluid: 'true',
						min: '16px',
						max: '32px'
					}
				}
			});
		});

		it('should handle fluid collection when desktop mode is null', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			// Mock the find methods to return null for desktop mode
			const originalFind = Array.prototype.find;
			Array.prototype.find = vi.fn().mockImplementation(function<T>(this: T[], callback: (value: T, index: number, array: T[]) => boolean) {
				const mode = originalFind.call(this, callback);
				if (mode && (mode as any).name?.toLowerCase() === 'desktop') {
					return null;
				}
				return mode;
			});

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						desktop: { r: 1, g: 0, b: 0 }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				}
			});

			// Restore original find method
			Array.prototype.find = originalFind;
		});

		it('should handle fluid collection when mobile mode is null', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			// Mock the find methods to return null for mobile mode
			const originalFind = Array.prototype.find;
			Array.prototype.find = vi.fn().mockImplementation(function<T>(this: T[], callback: (value: T, index: number, array: T[]) => boolean) {
				const mode = originalFind.call(this, callback);
				if (mode && (mode as any).name?.toLowerCase() === 'mobile') {
					return null;
				}
				return mode;
			});

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						desktop: { r: 1, g: 0, b: 0 }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				}
			});

			// Restore original find method
			Array.prototype.find = originalFind;
		});

		it('should handle fluid collection with null desktop variable in alias case', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'desktop-ref' },
						mobile: { type: 'VARIABLE_ALIAS', id: 'mobile-ref' }
					}
				})
				.mockResolvedValueOnce(null) // desktop variable is null
				.mockResolvedValueOnce({
					name: 'spacing/small',
					resolvedType: 'FLOAT'
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({ spacing: {} });
		});

		it('should handle fluid collection with null mobile variable in alias case', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'desktop-ref' },
						mobile: { type: 'VARIABLE_ALIAS', id: 'mobile-ref' }
					}
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT'
				})
				.mockResolvedValueOnce(null); // mobile variable is null

			const result = await processCollectionData(collection);

			expect(result).toEqual({ spacing: {} });
		});

		it('should handle fluid collection with null desktop variable in single alias case', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/mixed',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'large-ref' },
						mobile: 16
					}
				})
				.mockResolvedValueOnce(null); // desktop variable is null

			const result = await processCollectionData(collection);

			expect(result).toEqual({ spacing: {} });
		});

		it('should handle processCollectionModeData with null variable for alias', async () => {
			const collection = {
				name: 'Test Collection',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			};
			const mode = { modeId: 'mode1', name: 'Default' };

			// Mock variable with alias that resolves to null
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/secondary',
					resolvedType: 'COLOR',
					valuesByMode: {
						mode1: { type: 'VARIABLE_ALIAS', id: 'ref-var' }
					}
				})
				.mockResolvedValueOnce(null); // referenced variable is null

			const result = await processCollectionModeData(collection, mode);

			expect(result).toEqual({ color: {} });
		});

		it('should handle fluid collection when mobile mode is null', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			// Mock the find methods to return null for mobile mode
			const originalFind = Array.prototype.find;
			Array.prototype.find = vi.fn().mockImplementation(function<T>(this: T[], callback: (value: T, index: number, array: T[]) => boolean) {
				const mode = originalFind.call(this, callback);
				if (mode && (mode as any).name?.toLowerCase() === 'mobile') {
					return null;
				}
				return mode;
			});

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						desktop: { r: 1, g: 0, b: 0 }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				color: {
					primary: '#ff0000'
				}
			});

			// Restore original find method
			Array.prototype.find = originalFind;
		});

		it('should handle fluid collection when desktop variable reference is null', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'ref-var' },
						mobile: 16
					}
				})
				.mockResolvedValueOnce(null); // Desktop variable reference returns null

			const result = await processCollectionData(collection);

			expect(result).toEqual({ spacing: {} });
		});

		it('should handle fluid collection when mobile value is alias and desktop is direct value', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 32,
						mobile: { type: 'VARIABLE_ALIAS', id: 'ref-var' }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					responsive: '32px'
				}
			});
		});

		it('should handle fluid collection when desktop is alias and mobile is direct value', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'desktop-ref' },
						mobile: 16
					}
				})
				.mockResolvedValueOnce({
					name: 'spacing/large',
					resolvedType: 'FLOAT'
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					responsive: 'var(--wp--custom--spacing--large)'
				}
			});
		});

		it('should handle fluid collection when desktop alias variable is null', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: { type: 'VARIABLE_ALIAS', id: 'desktop-ref' },
						mobile: 16
					}
				})
				.mockResolvedValueOnce(null); // Desktop alias variable is null

			const result = await processCollectionData(collection);

			expect(result).toEqual({ spacing: {} });
		});

		it('should handle fluid collection when mobile is alias and desktop is direct - COLOR type', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'color/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						desktop: { r: 1, g: 0, b: 0 }, // Direct color value
						mobile: { type: 'VARIABLE_ALIAS', id: 'mobile-ref' }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				color: {
					primary: '#ff0000' // Should use desktop direct value
				}
			});
		});

		it('should handle fluid collection when mobile is alias and desktop is direct - FLOAT type', async () => {
			const collection = {
				name: 'Fluid Collection',
				modes: [
					{ modeId: 'desktop', name: 'Desktop' },
					{ modeId: 'mobile', name: 'Mobile' }
				],
				variableIds: ['var1']
			};

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce({
					name: 'spacing/responsive',
					resolvedType: 'FLOAT',
					valuesByMode: {
						desktop: 32, // Direct float value
						mobile: { type: 'VARIABLE_ALIAS', id: 'mobile-ref' }
					}
				});

			const result = await processCollectionData(collection);

			expect(result).toEqual({
				spacing: {
					responsive: '32px' // Should use desktop direct value
				}
			});
		});
	});
}); 