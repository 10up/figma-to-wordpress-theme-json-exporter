console.clear();

async function exportToJSON() {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	
	// Find the "Primitives" collection first
	const primitivesCollection = collections.find(
		collection => collection.name.toLowerCase() === "primitives"
	);
	
	if (!primitivesCollection) {
		figma.ui.postMessage({ 
			type: "EXPORT_RESULT", 
			error: "No 'Primitives' collection found. This is required as the base theme." 
		});
		return;
	}

	// Process the primitives collection first to create our base theme
	const baseThemeData = await processCollectionData(primitivesCollection);

	// Create the base theme file
	const themeFile = {
		fileName: "theme.json",
		body: {
			version: 3,
			settings: {
				custom: baseThemeData
			}
		}
	};

	// Array to store all files we need to output
	const allFiles = [themeFile];

	// Process all other collections and merge them into the base theme
	for (const collection of collections) {
		// Skip the primitives collection as we've already processed it
		if (collection.name.toLowerCase() === "primitives") {
			continue;
		}

		// Special handling for the Color collection
		if (collection.name.toLowerCase() === "color" && collection.modes.length > 0) {
			// Process the first mode normally and merge into the main theme
			const firstModeData = await processCollectionModeData(collection, collection.modes[0]);
			
			// Merge the first mode data into the appropriate location in the base theme
			mergeCollectionData(themeFile.body.settings.custom, "color", firstModeData);
			
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
			mergeCollectionData(themeFile.body.settings.custom, collectionName, collectionData);
		}
	}

	figma.ui.postMessage({ type: "EXPORT_RESULT", files: allFiles });
}

// Helper function to merge collection data into the base theme at the appropriate location
function mergeCollectionData(baseTheme, collectionName, collectionData) {
	// If a matching section already exists in the base theme, merge into it
	if (baseTheme[collectionName]) {
		// Deep merge the collection data with the existing section
		baseTheme[collectionName] = deepMerge(baseTheme[collectionName], collectionData);
	} else {
		// If no matching section exists, add the entire collection to the base theme
		baseTheme[collectionName] = collectionData;
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
							fluid: true,
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
							fluid: true,
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
		await exportToJSON();
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

function isAlias(value) {
	return value.toString().trim().charAt(0) === "{";
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

	const { r, g, b, a = 1 } = color;
	
	if (a !== 1) {
		return `rgba(${[r, g, b]
			.map((n) => Math.round(n * 255))
			.join(", ")}, ${a.toFixed(4)})`;
	}
	const toHex = (value) => {
		const hex = Math.round(value * 255).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	const hex = [toHex(r), toHex(g), toHex(b)].join("");
	return `#${hex}`;
}

function parseColor(color) {
	color = color.trim();
	const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
	const rgbaRegex =
		/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
	const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
	const hslaRegex =
		/^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
	const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
	const floatRgbRegex =
		/^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*opacity:\s*[\d\.]+)?\s*\}$/;

	if (rgbRegex.test(color)) {
		const [, r, g, b] = color.match(rgbRegex);
		return { r: parseInt(r) / 255, g: parseInt(g) / 255, b: parseInt(b) / 255 };
	} else if (rgbaRegex.test(color)) {
		const [, r, g, b, a] = color.match(rgbaRegex);
		return {
			r: parseInt(r) / 255,
			g: parseInt(g) / 255,
			b: parseInt(b) / 255,
			a: parseFloat(a),
		};
	} else if (hslRegex.test(color)) {
		const [, h, s, l] = color.match(hslRegex);
		return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
	} else if (hslaRegex.test(color)) {
		const [, h, s, l, a] = color.match(hslaRegex);
		return Object.assign(
			hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
			{ a: parseFloat(a) }
		);
	} else if (hexRegex.test(color)) {
		const hexValue = color.substring(1);
		const expandedHex =
			hexValue.length === 3
				? hexValue
					.split("")
					.map((char) => char + char)
					.join("")
				: hexValue;
		return {
			r: parseInt(expandedHex.slice(0, 2), 16) / 255,
			g: parseInt(expandedHex.slice(2, 4), 16) / 255,
			b: parseInt(expandedHex.slice(4, 6), 16) / 255,
		};
	} else if (floatRgbRegex.test(color)) {
		return JSON.parse(color);
	} else {
		throw new Error("Invalid color format");
	}
}

function hslToRgbFloat(h, s, l) {
	const hue2rgb = (p, q, t) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	if (s === 0) {
		return { r: l, g: l, b: l };
	}

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const r = hue2rgb(p, q, (h + 1 / 3) % 1);
	const g = hue2rgb(p, q, h % 1);
	const b = hue2rgb(p, q, (h - 1 / 3) % 1);

	return { r, g, b };
}