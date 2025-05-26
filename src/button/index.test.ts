import { describe, it, expect, beforeEach } from 'vitest';
import { processButtonStyles, clearProcessedButtonVariants } from './index';

describe('Button Functions', () => {
	beforeEach(() => {
		clearProcessedButtonVariants();
	});

	describe('processButtonStyles', () => {
		it('should return early if no primary button style exists', () => {
			const buttonData = {
				secondary: {
					default: { background: '#ccc', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(0);
			expect(buttonData).toEqual({
				secondary: {
					default: { background: '#ccc', text: '#000' }
				}
			});
		});

		it('should create CSS variable references for button states from primary when other variants exist', () => {
			const buttonData: any = {
				primary: {
					default: { background: '#000', text: '#fff' },
					hover: { background: '#333', text: '#fff' },
					disabled: { background: '#ccc', text: '#999' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(buttonData.default).toEqual({
				background: 'var(--wp--custom--color--button--primary--default--background)',
				text: 'var(--wp--custom--color--button--primary--default--text)'
			});
			expect(buttonData.hover).toEqual({
				background: 'var(--wp--custom--color--button--primary--hover--background)',
				text: 'var(--wp--custom--color--button--primary--hover--text)'
			});
			expect(buttonData.disabled).toEqual({
				background: 'var(--wp--custom--color--button--primary--disabled--background)',
				text: 'var(--wp--custom--color--button--primary--disabled--text)'
			});
		});

		it('should process secondary button variant and create file', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' },
					hover: { background: '#999', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(1);
			expect(allFiles[0]).toEqual({
				fileName: 'styles/button-secondary.json',
				body: {
					"$schema": "https://schemas.wp.org/trunk/theme.json",
					"version": 3,
					"title": "Secondary",
					"slug": "button-secondary",
					"blockTypes": ["core/button"],
					"settings": {
						"custom": {
							"color": {
								"button": {
									"default": {
										"background": "var(--wp--custom--color--button--secondary--default--background)",
										"text": "var(--wp--custom--color--button--secondary--default--text)"
									},
									"hover": {
										"background": "var(--wp--custom--color--button--secondary--hover--background)",
										"text": "var(--wp--custom--color--button--secondary--hover--text)"
									}
								}
							}
						}
					},
					"styles": {
						"color": {
							"background": "var(--wp--custom--color--button--default--background)",
							"text": "var(--wp--custom--color--button--default--text)"
						}
					}
				}
			});
		});

		it('should process multiple button variants', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				},
				tertiary: {
					default: { background: 'transparent', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(2);
			expect(allFiles[0].fileName).toBe('styles/button-secondary.json');
			expect(allFiles[1].fileName).toBe('styles/button-tertiary.json');
		});

		it('should handle button variants with spaces in names', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				'outline button': {
					default: { background: 'transparent', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(1);
			expect(allFiles[0].fileName).toBe('styles/button-outline-button.json');
			expect(allFiles[0].body.slug).toBe('button-outline-button');
		});

		it('should skip non-object button variants', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				},
				invalidVariant: 'not an object'
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(1);
			expect(allFiles[0].fileName).toBe('styles/button-secondary.json');
		});

		it('should skip unknown button variant names', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				},
				unknownVariant: {
					default: { background: '#999', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(1);
			expect(allFiles[0].fileName).toBe('styles/button-secondary.json');
		});

		it('should handle case insensitive button variant names', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				SECONDARY: {
					default: { background: '#ccc', text: '#000' }
				},
				Tertiary: {
					default: { background: 'transparent', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(2);
			expect(allFiles[0].fileName).toBe('styles/button-secondary.json');
			expect(allFiles[0].body.title).toBe('SECONDARY');
			expect(allFiles[1].fileName).toBe('styles/button-tertiary.json');
			expect(allFiles[1].body.title).toBe('Tertiary');
		});

		it('should not process the same variant twice', () => {
			const buttonData1 = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				}
			};
			const buttonData2 = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#999', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			// Process first time
			processButtonStyles(buttonData1, allFiles);
			expect(allFiles).toHaveLength(1);

			// Process second time - should not add duplicate
			processButtonStyles(buttonData2, allFiles);
			expect(allFiles).toHaveLength(1);
		});

		it('should handle all known button variant types', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				},
				tertiary: {
					default: { background: 'transparent', text: '#000' }
				},
				outline: {
					default: { background: 'transparent', text: '#000', border: '#000' }
				},
				ghost: {
					default: { background: 'transparent', text: '#000' }
				},
				link: {
					default: { background: 'transparent', text: '#0066cc' }
				},
				destructive: {
					default: { background: '#cc0000', text: '#fff' }
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(6); // All except primary
			const fileNames = allFiles.map(file => file.fileName);
			expect(fileNames).toContain('styles/button-secondary.json');
			expect(fileNames).toContain('styles/button-tertiary.json');
			expect(fileNames).toContain('styles/button-outline.json');
			expect(fileNames).toContain('styles/button-ghost.json');
			expect(fileNames).toContain('styles/button-link.json');
			expect(fileNames).toContain('styles/button-destructive.json');
		});

		it('should handle button variants with only some states', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' },
					hover: { background: '#333', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
					// No hover state
				}
			};
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			expect(allFiles).toHaveLength(1);
			expect(allFiles[0].body.settings.custom.color.button).toEqual({
				default: {
					background: 'var(--wp--custom--color--button--secondary--default--background)',
					text: 'var(--wp--custom--color--button--secondary--default--text)'
				}
				// No hover state should be present
			});
		});

		it('should skip inherited properties that are not own properties', () => {
			// Create an object with inherited properties
			const baseButton = {
				default: { background: '#inherited', text: '#inherited' }
			};
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				}
			};
			
			// Add secondary as inherited property
			Object.setPrototypeOf(buttonData, { secondary: baseButton });
			
			const allFiles: any[] = [];

			processButtonStyles(buttonData, allFiles);

			// Should not process inherited secondary
			expect(allFiles).toHaveLength(0);
		});
	});

	describe('clearProcessedButtonVariants', () => {
		it('should clear the processed variants set', () => {
			const buttonData = {
				primary: {
					default: { background: '#000', text: '#fff' }
				},
				secondary: {
					default: { background: '#ccc', text: '#000' }
				}
			};
			const allFiles: any[] = [];

			// Process once
			processButtonStyles(buttonData, allFiles);
			expect(allFiles).toHaveLength(1);

			// Clear and process again
			clearProcessedButtonVariants();
			processButtonStyles(buttonData, allFiles);
			expect(allFiles).toHaveLength(2); // Should add another file
		});
	});
}); 