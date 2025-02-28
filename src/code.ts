console.clear();

// Array to track which button variants we've already processed
// This needs to be outside of the function to persist between calls
const processedButtonVariants = new Set<string>();

// Interface for export options
interface ExportOptions {
	generateTypography?: boolean;
	baseTheme?: any;
}

async function exportToJSON(options: ExportOptions = {}) {
	// Clear the set of processed button variants at the start of a new export
	processedButtonVariants.clear();

	const collections = await figma.variables.getLocalVariableCollectionsAsync();

	// Find the "Primitives" collection first
	const primitivesCollection = collections.find(
		collection => collection.name.toLowerCase() === "primitives"
	);

	// Start with the base theme if provided, otherwise create a new theme object
	const theme = options.baseTheme || {
		"$schema": "https://schemas.wp.org/trunk/theme.json",
		"version": 3,
		"settings": {
			"custom": {}
		}
	};

	// Ensure the theme has the required structure
	theme.settings = theme.settings || {};
	theme.settings.custom = theme.settings.custom || {};

	// Array to store all files we need to output
	const allFiles = [{
		fileName: "theme.json",
		body: theme
	}];

	// Process the primitives collection first if it exists
	if (primitivesCollection) {
		const primitivesData = await processCollectionData(primitivesCollection);
		mergeCollectionData(theme.settings.custom, "", primitivesData);
	}

	// Process all other collections
	for (const collection of collections) {
		// Skip the primitives collection as we've already processed it
		if (collection.name.toLowerCase() === "primitives") {
			continue;
		}

		// Special handling for the Color collection
		if (collection.name.toLowerCase() === "color" && collection.modes.length > 0) {
			// Process the first mode normally and merge into the main theme
			const firstModeData = await processCollectionModeData(collection, collection.modes[0]);

			// Process button styles specially if they exist
			if (firstModeData && 'button' in firstModeData) {
				processButtonStyles(firstModeData.button as Record<string, any>, allFiles);
			}

			// Merge the first mode data into the appropriate location in the base theme
			mergeCollectionData(theme.settings.custom, "color", firstModeData);

			// Output the first mode as a separate file too
			const firstMode = collection.modes[0];
			const firstModeNameSlug = firstMode.name.toLowerCase().replace(/\s+/g, '-');
			const firstModeSectionFile = {
				fileName: `styles/section-${firstModeNameSlug}.json`,
				body: {
					"$schema": "https://schemas.wp.org/trunk/theme.json",
					"version": 3,
					"title": firstMode.name,
					"slug": `section-${firstModeNameSlug}`,
					"blockTypes": ["core/group"],
					"settings": {
						"custom": {
							"color": firstModeData
						}
					},
					"styles": {
						"color": {
							"background": "var(--wp--custom--color--surface--primary)",
							"text": "var(--wp--custom--color--text--primary)"
						}
					}
				}
			};
			allFiles.push(firstModeSectionFile);

			// Process additional modes for the Color collection
			for (let i = 1; i < collection.modes.length; i++) {
				const mode = collection.modes[i];
				const modeData = await processCollectionModeData(collection, mode);

				// Process button styles for this mode if they exist
				if (modeData && 'button' in modeData) {
					processButtonStyles(modeData.button as Record<string, any>, allFiles);
				}

				// Create separate file for this color mode
				const modeNameSlug = mode.name.toLowerCase().replace(/\s+/g, '-');
				const sectionFile = {
					fileName: `styles/section-${modeNameSlug}.json`,
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"title": mode.name,
						"slug": `section-${modeNameSlug}`,
						"blockTypes": ["core/group"],
						"settings": {
							"custom": {
								"color": modeData
							}
						},
						"styles": {
							"color": {
								"background": "var(--wp--custom--color--surface--primary)",
								"text": "var(--wp--custom--color--text--primary)"
							}
						}
					}
				};

				// Add this section file to our output
				allFiles.push(sectionFile);
			}
		} else {
			// For non-Color collections or Color collection with just one mode,
			// process normally
			const collectionData = await processCollectionData(collection);

			// Determine where to merge this collection's data based on its name
			const collectionName = collection.name.toLowerCase();

			// Merge the collection data into the appropriate location in the base theme
			mergeCollectionData(theme.settings.custom, collectionName, collectionData);
		}
	}

	// Add typography presets if requested
	if (options.generateTypography) {
		const typographyPresets = await getTypographyPresets();
		if (typographyPresets.length > 0) {
			theme.settings.custom.typography = theme.settings.custom.typography || {};
			theme.settings.custom.typography.presets = typographyPresets;
		}
	}

	// Send the result back to the UI
	figma.ui.postMessage({
		type: "EXPORT_RESULT",
		files: allFiles
	});
}

// Helper function to ensure font property variables have the proper WordPress path structure
function formatFontPropertyPath(nameParts: string[], propertyType: string): string[] {
	// Convert all parts to lowercase
	const lowerParts = nameParts.map(part => part.toLowerCase());

	// Check if this path already contains the correct prefixes
	const hasPropertyPrefix = lowerParts.some(part => part === propertyType);
	const hasFontPrefix = lowerParts.some(part => part === 'font');

	// Create new array with the required prefixes if they don't exist
	let formattedParts = [...lowerParts];

	if (!hasFontPrefix && !hasPropertyPrefix) {
		// Neither prefix exists, add both
		formattedParts = ['font', propertyType, ...formattedParts];
	} else if (hasFontPrefix && !hasPropertyPrefix) {
		// Only font prefix exists, add property type after it
		const fontIndex = formattedParts.findIndex(part => part === 'font');
		formattedParts.splice(fontIndex + 1, 0, propertyType);
	} else if (!hasFontPrefix && hasPropertyPrefix) {
		// Only property prefix exists, add font prefix before it
		const propertyIndex = formattedParts.findIndex(part => part === propertyType);
		formattedParts.splice(propertyIndex, 0, 'font');
	}

	return formattedParts;
}

// Function to retrieve and process text styles from Figma
async function getTypographyPresets(): Promise<any[]> {
	// Get all text styles in the document - use async version
	const textStyles = await figma.getLocalTextStylesAsync();
	const typographyPresets = [];

	// Process each text style
	for (const style of textStyles) {
		// Remove the console.log for production
		// console.log({style});

		// Create slug from style name
		const styleName = style.name;
		const slug = createSlugFromStyleName(styleName);

		// Create the preset object
		const preset: Record<string, any> = {
			slug,
			name: formatStyleName(styleName),
		};

		// Add selector for heading styles if applicable
		if (/^h[1-6]$/i.test(slug) || slug.startsWith('heading-')) {
			const headingMatch = styleName.match(/h([1-6])|heading[- ]([1-6])/i);
			const headingLevel = headingMatch ? (headingMatch[1] || headingMatch[2]) : null;

			if (headingLevel) {
				preset.selector = `h${headingLevel}`;
			}
		}

		// Add typography properties
		const {
			// @ts-expect-error the types are wrong
			fontFamily, fontSize, fontWeight, fontName, lineHeight, letterSpacing,
			// @ts-expect-error the types are wrong
			textCase, textDecoration, textDecorationColor, textDecorationOffset,
			// @ts-expect-error the types are wrong
			textDecorationSkipInk, textDecorationStyle, textDecorationThickness,
			hangingPunctuation, leadingTrim, boundVariables
		} = style;

		// Try to map to CSS variables when possible, using boundVariables if available
		if (fontFamily) {
			if (boundVariables?.fontFamily) {
				// Get the variable directly from boundVariables
				const variableId = boundVariables.fontFamily.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				// Format path for font-family to ensure it has the right structure
				const formattedParts = formatFontPropertyPath(nameParts, 'family');
				preset.fontFamily = buildCssVarReference(formattedParts);
			} else {
				// Fallback to the old method if no bound variable
				const fontFamilyVar = await findFontFamilyVariable(fontFamily);
				preset.fontFamily = fontFamilyVar || fontFamily;
			}
		} else if (fontName?.family) {
			// Use fontName.family as a fallback if fontFamily is not available
			const fontFamilyVar = await findFontFamilyVariable(fontName.family);
			preset.fontFamily = fontFamilyVar || fontName.family;
		}

		if (fontSize) {
			if (boundVariables?.fontSize) {
				// Get the variable directly from boundVariables
				const variableId = boundVariables.fontSize.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				// Format path for font-size to ensure it has the right structure
				const formattedParts = formatFontPropertyPath(nameParts, 'size');
				preset.fontSize = buildCssVarReference(formattedParts);
			} else {
				// Fallback to the old method if no bound variable
				const fontSizeVar = await findFontSizeVariable(fontSize);
				preset.fontSize = fontSizeVar || `${fontSize}px`;
			}
		}

		if (fontWeight) {
			if (boundVariables?.fontWeight) {
				// Get the variable directly from boundVariables
				const variableId = boundVariables.fontWeight.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				// Format path for font-weight to ensure it has the right structure
				const formattedParts = formatFontPropertyPath(nameParts, 'weight');
				preset.fontWeight = buildCssVarReference(formattedParts);
			} else {
				// Fallback to the old method if no bound variable
				const fontWeightVar = await findFontWeightVariable(fontWeight);
				preset.fontWeight = fontWeightVar || fontWeight;
			}
		} else if (fontName?.style) {
			// Extract font weight from fontName.style if available
			// Common mappings for font weight names to numeric values
			const fontWeightMap = {
				'thin': 100,
				'extralight': 200, 'extra light': 200, 'ultra light': 200,
				'light': 300,
				'normal': 400, 'regular': 400,
				'medium': 500,
				'semibold': 600, 'semi bold': 600, 'demi bold': 600,
				'bold': 700,
				'extrabold': 800, 'extra bold': 800, 'ultra bold': 800,
				'black': 900, 'heavy': 900
			};

			// Convert style to lowercase for matching
			const styleKey = fontName.style.toLowerCase();

			// First, check for direct numeric values like "700"
			const numericWeight = parseInt(styleKey, 10);
			if (!isNaN(numericWeight) && numericWeight >= 100 && numericWeight <= 900) {
				preset.fontWeight = numericWeight;
			} else {
				// Then check for weight name mapping
				for (const [name, value] of Object.entries(fontWeightMap)) {
					if (styleKey.includes(name)) {
						preset.fontWeight = value;
						break;
					}
				}
			}
		}

		// Handle lineHeight with bound variable if available
		if (lineHeight !== undefined) {
			// Check for bound variable first
			if (boundVariables?.lineHeight) {
				const variableId = boundVariables.lineHeight.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				// Format path for line-height to ensure it has the right structure
				const formattedParts = formatFontPropertyPath(nameParts, 'line-height');
				preset.lineHeight = buildCssVarReference(formattedParts);
			} else {
				// Fall back to the existing formatting logic if no bound variable
				// Handle complex object format
				if (typeof lineHeight === 'object' && lineHeight !== null) {
					// Access unit and value safely
					const unit = 'unit' in lineHeight ? (lineHeight as any).unit : null;
					const value = 'value' in lineHeight ? (lineHeight as any).value : null;

					// For percent units, just output the numeric value as a string
					if (unit === 'PERCENT' && value !== null) {
						// Convert percentage to decimal (e.g., 120 -> 1.2)
						preset.lineHeight = roundToMax3Decimals(value / 100);
					} else if (unit === 'PIXELS' && value !== null) {
						// Convert pixel values to unitless relative to font size
						preset.lineHeight = roundToMax3Decimals(value / fontSize);
					} else if (value !== null) {
						// For other units, keep the raw value
						preset.lineHeight = roundToMax3Decimals(value);
					} else {
						// Fallback to 'normal' if we can't determine a proper value
						preset.lineHeight = 'normal';
					}
				} else {
					// Convert to number or keep as is if it's already unitless
					const lineHeightStr = lineHeight.toString();
					if (lineHeightStr.endsWith('px')) {
						const pixelValue = parseFloat(lineHeightStr);
						preset.lineHeight = roundToMax3Decimals(pixelValue / fontSize);
					} else if (lineHeightStr.endsWith('%')) {
						// Convert percentage string to decimal
						const percentValue = parseFloat(lineHeightStr.replace('%', ''));
						preset.lineHeight = roundToMax3Decimals(percentValue / 100);
					} else {
						preset.lineHeight = roundToMax3Decimals(parseFloat(lineHeightStr));
					}
				}
			}
		}

		// Handle letterSpacing with bound variable if available
		if (letterSpacing !== undefined) {
			// Check for bound variable first
			if (boundVariables?.letterSpacing) {
				const variableId = boundVariables.letterSpacing.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				// Format path for letter-spacing to ensure it has the right structure
				const formattedParts = formatFontPropertyPath(nameParts, 'letter-spacing');
				preset.letterSpacing = buildCssVarReference(formattedParts);
			} else {
				// Fall back to the existing formatting logic if no bound variable
				// Handle complex object format
				if (typeof letterSpacing === 'object' && letterSpacing !== null) {
					// Access unit and value safely
					const unit = 'unit' in letterSpacing ? (letterSpacing as any).unit : null;
					const value = 'value' in letterSpacing ? (letterSpacing as any).value : null;

					// For percent units with 0 value, output just 0 (numeric)
					if (unit === 'PERCENT' && value === 0) {
						preset.letterSpacing = 0;
					} else if (unit === 'PIXELS' && value !== null) {
						// Convert pixel values to em units relative to font size
						const emValue = value / fontSize;
						preset.letterSpacing = `${roundToMax3Decimals(emValue)}em`;
					} else if (value !== null) {
						// For other units, keep the raw value
						preset.letterSpacing = roundToMax3Decimals(value);
					} else {
						// Fallback to 0 if we can't determine a proper value
						preset.letterSpacing = 0;
					}
				} else {
					// Convert to em units for WordPress
					const letterSpacingStr = letterSpacing.toString();
					if (letterSpacingStr.endsWith('px')) {
						const pixelValue = parseFloat(letterSpacingStr);
						const emValue = pixelValue / fontSize;
						preset.letterSpacing = `${roundToMax3Decimals(emValue)}em`;
					} else {
						preset.letterSpacing = roundToMax3Decimals(parseFloat(letterSpacingStr));
					}
				}
			}
		}

		// Handle textCase
		if (textCase !== undefined && textCase !== "ORIGINAL") {
			const textCaseMap = {
				"UPPER": "uppercase",
				"LOWER": "lowercase",
				"TITLE": "capitalize",
				"SMALL_CAPS": "small-caps",
				"SMALL_CAPS_FORCED": "small-caps"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textCase) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textCase.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textTransform = buildCssVarReference(nameParts);
			} else if (textCase in textCaseMap) {
				preset.textTransform = textCaseMap[textCase];
			}
		}

		// Handle textDecoration
		if (textDecoration !== undefined && textDecoration !== "NONE") {
			const decorationMap = {
				"UNDERLINE": "underline",
				"STRIKETHROUGH": "line-through"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecoration) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecoration.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textDecoration = buildCssVarReference(nameParts);
			} else if (textDecoration in decorationMap) {
				preset.textDecoration = decorationMap[textDecoration];
			}
		}

		// Handle textDecorationColor
		if (textDecorationColor) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationColor) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationColor.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textDecorationColor = buildCssVarReference(nameParts);
			} else if (typeof textDecorationColor === 'object') {
				// Convert color object to hex or rgba and only set if valid
				const colorValue = rgbToHex(textDecorationColor);
				if (colorValue !== null) {
					preset.textDecorationColor = colorValue;
				}
			} else if (typeof textDecorationColor === 'string') {
				preset.textDecorationColor = textDecorationColor;
			}
		}

		// Handle textDecorationStyle
		if (textDecorationStyle !== undefined && textDecorationStyle !== "SOLID") {
			const styleMap = {
				"DASHED": "dashed",
				"DOTTED": "dotted",
				"WAVY": "wavy"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationStyle) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationStyle.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textDecorationStyle = buildCssVarReference(nameParts);
			} else if (textDecorationStyle in styleMap) {
				preset.textDecorationStyle = styleMap[textDecorationStyle];
			}
		}

		// Handle textDecorationThickness
		if (textDecorationThickness !== undefined) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationThickness) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationThickness.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textDecorationThickness = buildCssVarReference(nameParts);
			} else {
				// Only set if we have a valid value
				if (typeof textDecorationThickness === 'object') {
					// If it's an object, only use if it has a value property
					if (textDecorationThickness && 'value' in textDecorationThickness &&
						typeof textDecorationThickness.value === 'number') {
						preset.textDecorationThickness = `${textDecorationThickness.value}px`;
					}
					// Otherwise omit the property
				} else if (typeof textDecorationThickness === 'number') {
					// Convert to px units for WordPress
					preset.textDecorationThickness = `${textDecorationThickness}px`;
				}
				// Do not set a default - omit if invalid
			}
		}

		// Handle textDecorationOffset
		if (textDecorationOffset !== undefined) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationOffset) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationOffset.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textUnderlineOffset = buildCssVarReference(nameParts);
			} else {
				// Only set if we have a valid value
				if (typeof textDecorationOffset === 'object') {
					// If it's an object, only use if it has a value property
					if (textDecorationOffset && 'value' in textDecorationOffset &&
						typeof textDecorationOffset.value === 'number') {
						preset.textUnderlineOffset = `${textDecorationOffset.value}px`;
					}
					// Otherwise omit the property
				} else if (typeof textDecorationOffset === 'number') {
					// Convert to px units for WordPress
					preset.textUnderlineOffset = `${textDecorationOffset}px`;
				}
				// Do not set a default - omit if invalid
			}
		}

		// Handle textDecorationSkipInk
		if (textDecorationSkipInk !== undefined && textDecorationSkipInk !== "AUTO") {
			const skipInkMap = {
				"NONE": "none",
				"ALL": "all"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationSkipInk) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationSkipInk.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.textDecorationSkipInk = buildCssVarReference(nameParts);
			} else if (textDecorationSkipInk in skipInkMap) {
				preset.textDecorationSkipInk = skipInkMap[textDecorationSkipInk];
			}
		}

		// Handle hangingPunctuation
		if (hangingPunctuation !== undefined) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.hangingPunctuation) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.hangingPunctuation.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.hangingPunctuation = buildCssVarReference(nameParts);
			} else {
				preset.hangingPunctuation = hangingPunctuation ? "first" : "none";
			}
		}

		// Handle leadingTrim
		// @ts-expect-error the types are wrong
		if (leadingTrim !== undefined && leadingTrim !== "AUTO") {
			const leadingTrimMap = {
				"NONE": "none",
				"BOTH": "both",
				"CAP": "start",
				"ALPHABETIC": "end"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.leadingTrim) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.leadingTrim.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				const nameParts = variable.name.split("/").map(part => part.toLowerCase());
				preset.leadingTrim = buildCssVarReference(nameParts);
			} else if (leadingTrim in leadingTrimMap) {
				preset.leadingTrim = leadingTrimMap[leadingTrim];
			}
		}

		typographyPresets.push(preset);
	}

	return typographyPresets;
}

// Helper function to create a slug from a style name
function createSlugFromStyleName(styleName: string): string {
	// Split the style name by common separators to handle hierarchical paths
	const parts = styleName.toLowerCase().split(/[/|\\-_]/);

	// Remove duplicate adjacent parts (e.g., "body/body-md" -> "body-md")
	const uniqueParts = parts.filter((part, index) => {
		if (index === 0) return true;

		// Check if this part is a duplicate of the previous part
		// or if it's a size variant (e.g., md, lg, etc.)
		const prevPart = parts[index - 1].trim();
		const currentPart = part.trim();

		// If the previous part is contained in the current part (e.g., "body" in "body-md"),
		// or if they're identical, skip the duplicate
		return !(prevPart === currentPart ||
			(currentPart.startsWith(prevPart) &&
				/^[a-z]+[0-9]*$/.test(currentPart.substring(prevPart.length).trim())));
	});

	// Create the slug from the cleaned parts
	return uniqueParts
		.join('-')
		.replace(/[^a-z0-9-]+/g, '-') // Replace any remaining non-alphanumeric chars with dashes
		.replace(/-+/g, '-')          // Replace multiple consecutive dashes with a single dash
		.replace(/^-|-$/g, '');       // Remove leading and trailing dashes
}

// Helper function to format style name for display
function formatStyleName(styleName: string): string {
	// Split by common separators to handle hierarchical paths
	const parts = styleName.split(/[/|\\-_]/);

	// Remove duplicate adjacent parts
	const uniqueParts = parts.filter((part, index) => {
		if (index === 0) return true;

		// Check if this part is a duplicate of the previous part
		const prevPart = parts[index - 1].trim().toLowerCase();
		const currentPart = part.trim().toLowerCase();

		// If the parts are identical, or the current part is just a variant of the previous part,
		// skip the duplicate
		return !(prevPart === currentPart ||
			(currentPart.startsWith(prevPart) &&
				/^[a-z]+[0-9]*$/.test(currentPart.substring(prevPart.length).trim())));
	});

	// Format the remaining parts (capitalize first letter of each part)
	return uniqueParts
		.map(part => part.trim())
		.filter(part => part.length > 0)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

// Helper function to try to find a matching font family variable
async function findFontFamilyVariable(fontFamily: string): Promise<string | null> {
	// First check if it's a WordPress preset font family
	const wpPresetMatch = fontFamily.match(/^(sans|serif|monospace|system)$/i);
	if (wpPresetMatch) {
		return `var(--wp--preset--font-family--${wpPresetMatch[1].toLowerCase()})`;
	}

	// Try to find a custom font family variable in the document
	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		for (const collection of collections) {
			// @ts-expect-error the types are wrong
			const variables = await figma.variables.getVariablesByCollectionIdAsync(collection.id);

			for (const variable of variables) {
				// Look for variables that might be font families
				if (variable.name.toLowerCase().includes('font') &&
					variable.name.toLowerCase().includes('family')) {

					const valuesByMode = await figma.variables.getVariableByIdAsync(variable.id)
						.then(v => v.valuesByMode);

					// Check each mode's value
					for (const [_, value] of Object.entries(valuesByMode)) {
						if (value === fontFamily) {
							// Found a match, return as a CSS variable reference
							const nameParts = variable.name.split("/").map(part => part.toLowerCase());
							return buildCssVarReference(nameParts);
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Error finding font family variable:", error);
	}

	// If no match is found, check if it might be a custom WordPress preset
	const cleanedName = fontFamily.toLowerCase().replace(/\s+/g, '-');
	return `var(--wp--preset--font-family--${cleanedName})`;
}

// Helper function to try to find a matching font size variable
async function findFontSizeVariable(fontSize: number): Promise<string | null> {
	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		for (const collection of collections) {
			// @ts-expect-error the types are wrong
			const variables = await figma.variables.getVariablesByCollectionIdAsync(collection.id);

			for (const variable of variables) {
				// Look for variables that might be font sizes
				if (variable.name.toLowerCase().includes('font') &&
					variable.name.toLowerCase().includes('size')) {

					const variableInfo = await figma.variables.getVariableByIdAsync(variable.id);

					// Check each mode's value
					for (const [_, value] of Object.entries(variableInfo.valuesByMode)) {
						if (value === fontSize) {
							// Found a match, return as a CSS variable reference
							const nameParts = variable.name.split("/").map(part => part.toLowerCase());
							return buildCssVarReference(nameParts);
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Error finding font size variable:", error);
	}

	return null;
}

// Helper function to try to find a matching font weight variable
async function findFontWeightVariable(fontWeight: number): Promise<string | null> {
	// Map of common font weight names
	const weightNames = {
		100: 'thin',
		200: 'extra-light',
		300: 'light',
		400: 'regular',
		500: 'medium',
		600: 'semi-bold',
		700: 'bold',
		800: 'extra-bold',
		900: 'black'
	};

	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		for (const collection of collections) {
			// @ts-expect-error the types are wrong
			const variables = await figma.variables.getVariablesByCollectionIdAsync(collection.id);

			for (const variable of variables) {
				// Look for variables that might be font weights
				if (variable.name.toLowerCase().includes('font') &&
					variable.name.toLowerCase().includes('weight')) {

					const variableInfo = await figma.variables.getVariableByIdAsync(variable.id);

					// Check each mode's value
					for (const [_, value] of Object.entries(variableInfo.valuesByMode)) {
						if (value === fontWeight) {
							// Found a match, return as a CSS variable reference
							const nameParts = variable.name.split("/").map(part => part.toLowerCase());
							return buildCssVarReference(nameParts);
						}
					}

					// Check for name-based match (like "bold" for 700)
					if (fontWeight in weightNames) {
						const weightName = weightNames[fontWeight];
						if (variable.name.toLowerCase().includes(weightName)) {
							const nameParts = variable.name.split("/").map(part => part.toLowerCase());
							return buildCssVarReference(nameParts);
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Error finding font weight variable:", error);
	}

	return null;
}

// Helper function to merge collection data into the base theme at the appropriate location
function mergeCollectionData(baseTheme, collectionName, collectionData) {
	// If collection name is empty, merge directly into base theme
	if (collectionName === "") {
		// Deep merge the collection data with the base theme
		Object.keys(collectionData).forEach(key => {
			if (baseTheme[key]) {
				baseTheme[key] = deepMerge(baseTheme[key], collectionData[key]);
			} else {
				baseTheme[key] = collectionData[key];
			}
		});
	} else {
		// If a matching section already exists in the base theme, merge into it
		if (baseTheme[collectionName]) {
			// Deep merge the collection data with the existing section
			baseTheme[collectionName] = deepMerge(baseTheme[collectionName], collectionData);
		} else {
			// If no matching section exists, add the entire collection to the base theme
			baseTheme[collectionName] = collectionData;
		}
	}
}

// Helper function to perform a deep merge of objects
function deepMerge(target, source) {
	// If either is not an object, return source (overwrite)
	if (typeof target !== 'object' || typeof source !== 'object') {
		return source;
	}

	// Create a new object to avoid modifying the originals
	const result = { ...target };

	// Iterate through all properties of source
	for (const key in source) {
		// If property exists in both and both are objects, recursively merge
		if (key in result && typeof result[key] === 'object' && typeof source[key] === 'object') {
			result[key] = deepMerge(result[key], source[key]);
		} else {
			// Otherwise just copy the property from source
			result[key] = source[key];
		}
	}

	return result;
}

// Helper function to check if a value appears to be a variable alias
function isVariableAlias(value: any): boolean {
	return value && typeof value === 'object' && value.type === "VARIABLE_ALIAS";
}

// TypeScript interface for Figma Variable Collection Mode
interface VariableCollectionMode {
	modeId: string;
	name: string;
}

// Helper function to determine if a value should have 'px' units appended
function shouldAddPxUnit(nameParts: string[], value: any): boolean {
	// Skip if value is not a number or is already a string
	if (typeof value !== 'number' || value === 0) {
		return false;
	}

	// Categories that should have px units
	const pxCategories = ['spacing', 'font', 'size', 'grid', 'radius', 'width', 'height'];

	// Check if any of the path parts match our px categories
	return nameParts.some(part => pxCategories.includes(part.toLowerCase()));
}

// Helper function to format value with px units when appropriate
function formatValueWithUnits(nameParts: string[], value: any): any {
	if (shouldAddPxUnit(nameParts, value)) {
		return `${value}px`;
	}
	return value;
}

// New helper function to process a specific mode of a collection
async function processCollectionModeData(collection: VariableCollection, mode: VariableCollectionMode) {
	const { variableIds } = collection;
	const variablesData = {};

	for (const variableId of variableIds) {
		const { name, resolvedType, valuesByMode } =
			await figma.variables.getVariableByIdAsync(variableId);
		const value = valuesByMode[mode.modeId];

		if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
			// Build the nested structure in our temporary object
			let obj = variablesData;
			// Convert the name parts to lowercase
			const nameParts = name.split("/").map(part => part.toLowerCase());

			// Navigate to the appropriate nesting level
			for (let i = 0; i < nameParts.length - 1; i++) {
				const part = nameParts[i];
				obj[part] = obj[part] || {};
				obj = obj[part];
			}

			// Set the actual value at the leaf node
			const leafName = nameParts[nameParts.length - 1];

			if (isVariableAlias(value)) {
				const currentVar = await figma.variables.getVariableByIdAsync((value as any).id);
				// Convert the reference to a CSS custom property reference with lowercase parts
				const referenceParts = currentVar.name.split("/").map(part => part.toLowerCase());
				obj[leafName] = buildCssVarReference(referenceParts);
			} else {
				obj[leafName] = resolvedType === "COLOR" ?
					rgbToHex(value) :
					formatValueWithUnits(nameParts, value);
			}
		}
	}

	return variablesData;
}

// Update processCollectionData to use the new helper function
async function processCollectionData({ name, modes, variableIds }: VariableCollection) {
	// Check if this collection has exactly two modes named "Desktop" and "Mobile"
	const isFluidCollection = modes.length === 2 &&
		modes.some(mode => mode.name.toLowerCase() === "desktop") &&
		modes.some(mode => mode.name.toLowerCase() === "mobile");

	if (isFluidCollection) {
		// Handle fluid responsive collection
		// Find the Desktop and Mobile mode IDs
		const desktopMode = modes.find(mode => mode.name.toLowerCase() === "desktop");
		const mobileMode = modes.find(mode => mode.name.toLowerCase() === "mobile");
		const desktopModeId = desktopMode.modeId;
		const mobileModeId = mobileMode.modeId;

		// Create a temporary object to hold our variable structure
		const variablesData = {};

		// Process all variables
		for (const variableId of variableIds) {
			const { name, resolvedType, valuesByMode } =
				await figma.variables.getVariableByIdAsync(variableId);

			const desktopValue = valuesByMode[desktopModeId];
			const mobileValue = valuesByMode[mobileModeId];

			if (desktopValue !== undefined && mobileValue !== undefined &&
				["COLOR", "FLOAT"].includes(resolvedType)) {

				// Build the nested structure in our temporary object
				let obj = variablesData;
				// Convert the name parts to lowercase
				const nameParts = name.split("/").map(part => part.toLowerCase());

				// Navigate to the appropriate nesting level
				for (let i = 0; i < nameParts.length - 1; i++) {
					const part = nameParts[i];
					obj[part] = obj[part] || {};
					obj = obj[part];
				}

				// Set the actual value at the leaf node
				const leafName = nameParts[nameParts.length - 1];

				if (isVariableAlias(desktopValue) && isVariableAlias(mobileValue)) {
					// Both are references
					const desktopVar = await figma.variables.getVariableByIdAsync((desktopValue as any).id);
					const mobileVar = await figma.variables.getVariableByIdAsync((mobileValue as any).id);

					// Convert the references to CSS custom property references
					const desktopReferenceParts = desktopVar.name.split("/").map(part => part.toLowerCase());
					const mobileReferenceParts = mobileVar.name.split("/").map(part => part.toLowerCase());

					const maxValue = buildCssVarReference(desktopReferenceParts);
					const minValue = buildCssVarReference(mobileReferenceParts);

					// If min and max are the same, use the value directly
					if (maxValue === minValue) {
						obj[leafName] = maxValue;
					} else {
						obj[leafName] = {
							fluid: "true",
							min: minValue,
							max: maxValue
						};
					}
				} else if (isVariableAlias(desktopValue) || isVariableAlias(mobileValue)) {
					// Only one is a reference, the other is a direct value
					if (isVariableAlias(desktopValue)) {
						const desktopVar = await figma.variables.getVariableByIdAsync((desktopValue as any).id);
						const desktopReferenceParts = desktopVar.name.split("/").map(part => part.toLowerCase());
						obj[leafName] = buildCssVarReference(desktopReferenceParts);
					} else {
						obj[leafName] = resolvedType === "COLOR" ?
							rgbToHex(desktopValue) :
							formatValueWithUnits(nameParts, desktopValue);
					}
				} else {
					// Both are direct values
					const maxValue = resolvedType === "COLOR" ?
						rgbToHex(desktopValue) :
						formatValueWithUnits(nameParts, desktopValue);
					const minValue = resolvedType === "COLOR" ?
						rgbToHex(mobileValue) :
						formatValueWithUnits(nameParts, mobileValue);

					// If min and max are the same, use the value directly
					if (JSON.stringify(maxValue) === JSON.stringify(minValue)) {
						obj[leafName] = maxValue;
					} else {
						obj[leafName] = {
							fluid: "true",
							min: minValue,
							max: maxValue
						};
					}
				}
			}
		}

		return variablesData;
	} else {
		// For regular collections, use the first mode
		return await processCollectionModeData(
			{ name, modes, variableIds } as VariableCollection,
			modes[0]
		);
	}
}

figma.ui.onmessage = async (e) => {
	console.log("code received message", e);
	if (e.type === "EXPORT") {
		// Extract options from the message
		const options: ExportOptions = e.options || {};
		await exportToJSON(options);
	} else if (e.type === "RESIZE") {
		// Handle resize message from the UI
		if (e.width && e.height) {
			figma.ui.resize(
				Math.max(300, Math.round(e.width)),
				Math.max(300, Math.round(e.height))
			);
		}
	}
};

if (figma.command === "export") {
	figma.showUI(__uiFiles__["export"], {
		width: 500,
		height: 500,
		themeColors: true,
	});
}

// Helper function to convert camelCase to kebab-case
function camelToKebabCase(value: string) {
	return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to build a WordPress custom property path
function buildWpCustomPropertyPath(nameParts: string[]) {
	// Convert each part to lowercase and then kebab case
	const kebabParts = nameParts.map(part => camelToKebabCase(part.toLowerCase()));
	// Join with -- and prefix with --wp--custom--
	return `--wp--custom--${kebabParts.join('--')}`;
}

// Helper function to build a CSS var() reference
function buildCssVarReference(nameParts: string[]) {
	return `var(${buildWpCustomPropertyPath(nameParts)})`;
}

// Fix the rgbToHex function to handle both direct RGB values and variable aliases
function rgbToHex(color: any) {
	// If color is already a string (happens sometimes with rgba values), return it
	if (typeof color === "string") {
		return color;
	}

	// Check if color is null or not an object
	if (!color || typeof color !== 'object') {
		return null; // Return null instead of default color so property can be omitted
	}

	// Check if r, g, b components exist and are numbers
	if (typeof color.r !== 'number' || typeof color.g !== 'number' || typeof color.b !== 'number') {
		return null; // Return null for invalid color formats
	}

	// Safely extract r, g, b values
	const r = color.r;
	const g = color.g;
	const b = color.b;
	const a = typeof color.a === 'number' ? color.a : 1;

	// Check for NaN values
	if (isNaN(r) || isNaN(g) || isNaN(b)) {
		return null; // Return null if any value is NaN
	}

	if (a !== 1) {
		// Ensure each RGB value is valid before converting
		const rValue = Math.max(0, Math.min(1, r));
		const gValue = Math.max(0, Math.min(1, g));
		const bValue = Math.max(0, Math.min(1, b));

		return `rgba(${[rValue, gValue, bValue]
			.map((n) => Math.round(n * 255))
			.join(", ")}, ${a.toFixed(4)})`;
	}

	const toHex = (value) => {
		// Clamp value between 0-1
		const clampedValue = Math.max(0, Math.min(1, value));
		const hex = Math.round(clampedValue * 255).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	const hex = [toHex(r), toHex(g), toHex(b)].join("");
	return `#${hex}`;
}

// Helper function to process button styles in the color data
function processButtonStyles(buttonData: Record<string, any>, allFiles: any[]): void {
	// First, check if we have a "primary" button style
	if (!buttonData.primary) {
		// If there's no primary button style, we don't need special processing
		return;
	}

	// Instead of directly copying primary button properties, create references to CSS variables
	const buttonStates = ['default', 'hover', 'disabled'];
	buttonStates.forEach(state => {
		if (buttonData.primary[state]) {
			// Create the state object at root level if it doesn't exist
			if (!buttonData[state]) {
				buttonData[state] = {};
			}

			// For each property in the primary button state, create a CSS variable reference
			for (const prop in buttonData.primary[state]) {
				// Reference the property using a CSS var that points to the primary button value
				buttonData[state][prop] = `var(--wp--custom--color--button--primary--${state}--${prop})`;
			}
		}
	});

	// Define known button variant names (case-insensitive)
	// This ensures we only generate files for main button variants
	const knownButtonVariants = ['secondary', 'tertiary', 'outline', 'ghost', 'link', 'destructive'];

	// Filter to only include direct child keys that match known button variant names
	const buttonVariants = Object.keys(buttonData).filter(key => {
		const keyLower = key.toLowerCase();
		return (
			// Skip primary as we don't want a file for it
			keyLower !== 'primary' &&
			// Match against our known button variant names
			knownButtonVariants.includes(keyLower) &&
			// Only include if it's a direct property (not inherited)
			Object.prototype.hasOwnProperty.call(buttonData, key) &&
			// Make sure it's an object (not a primitive value)
			typeof buttonData[key] === 'object' &&
			// Skip variants we've already processed to avoid duplicates
			!processedButtonVariants.has(keyLower)
		);
	});

	// Process each button variant as a separate file
	for (const variantName of buttonVariants) {
		const variantLower = variantName.toLowerCase();

		// Mark this variant as processed
		processedButtonVariants.add(variantLower);

		// Create a separate style file for each button variant
		const variantSlug = variantLower.replace(/\s+/g, '-');

		// Create flattened structure that references the variant's CSS custom properties
		const flattenedButtonSettings = {};

		// Map states (default, hover, disabled) if they exist in the variant
		const variantData = buttonData[variantName];

		// Process each button state
		buttonStates.forEach(state => {
			if (variantData[state]) {
				flattenedButtonSettings[state] = {};

				// For each property in the state (background, text, border, etc.)
				for (const prop in variantData[state]) {
					// Reference the property using a CSS var that points to the variant's value
					flattenedButtonSettings[state][prop] =
						`var(--wp--custom--color--button--${variantSlug}--${state}--${prop})`;
				}
			}
		});

		const buttonStyleFile = {
			fileName: `styles/button-${variantSlug}.json`,
			body: {
				"$schema": "https://schemas.wp.org/trunk/theme.json",
				"version": 3,
				"title": capitalizeFirstLetter(variantName),
				"slug": `button-${variantSlug}`,
				"blockTypes": ["core/button"],
				"settings": {
					"custom": {
						"color": {
							"button": flattenedButtonSettings
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
		};

		allFiles.push(buttonStyleFile);
	}
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to round numbers nicely with max 3 decimal places
function roundToMax3Decimals(value: number): number | string {
	// Round to 3 decimal places
	const rounded = Math.round(value * 1000) / 1000;
	// Convert to string to check if it's an integer
	const valueStr = rounded.toString();
	// If it's a whole number, return it as a number
	if (valueStr.indexOf('.') === -1) {
		return rounded;
	}
	// Return as string with no trailing zeros
	return parseFloat(valueStr).toString();
}
