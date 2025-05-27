import { isVariableAlias } from '../utils/index';
import { buildCssVarReference } from '../utils/css';

interface SpacingPreset {
	name: string;
	slug: string;
	size: string;
}

/**
 * Converts a variable name to a human-readable label
 */
function nameToLabel(name: string): string {
	// Split by forward slashes and take the last part
	const lastPart = name.split('/').pop() || name;
	
	// Check if this is a fluid spacing pattern (two numbers separated by underscore)
	// Pattern is MAX_MIN, so we need to swap them for display as MIN → MAX
	const fluidPattern = /^(\d+)_(\d+)$/;
	const fluidMatch = lastPart.match(fluidPattern);
	
	if (fluidMatch) {
		const [, maxValue, minValue] = fluidMatch;
		// If both values are the same, just use the single value
		if (maxValue === minValue) {
			return maxValue;
		}
		return `Fluid (${minValue} → ${maxValue})`;
	}
	
	// Split by hyphens, underscores, or camelCase
	const words = lastPart
		.replace(/([a-z])([A-Z])/g, '$1 $2') // Handle camelCase
		.split(/[-_\s]+/) // Split by hyphens, underscores, or spaces
		.filter(word => word.length > 0);
	
	// Capitalize each word
	return words
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Converts a variable name to a slug
 */
function nameToSlug(name: string): string {
	// Split by forward slashes and take the last part
	const lastPart = name.split('/').pop() || name;
	
	// Convert to lowercase and replace non-alphanumeric characters with hyphens
	return lastPart
		.toLowerCase()
		.replace(/([a-z])([A-Z])/g, '$1-$2') // Handle camelCase
		.replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates spacing presets from Figma spacing variables
 */
export async function getSpacingPresets(): Promise<SpacingPreset[]> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const spacingPresets: SpacingPreset[] = [];

	for (const collection of collections) {
		const collectionName = collection.name.toLowerCase();
		
		// Only process "Spacing" collection and spacing variables from "Primitives" collection
		const isSpacingCollection = collectionName === 'spacing';
		const isPrimitivesCollection = collectionName === 'primitives';
		
		if (!isSpacingCollection && !isPrimitivesCollection) {
			continue;
		}

		// Use the first mode for spacing presets
		const mode = collection.modes[0];
		if (!mode) continue;

		for (const variableId of collection.variableIds) {
			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			const { name, resolvedType, valuesByMode } = variable;
			const value = valuesByMode[mode.modeId];

			// Process FLOAT variables
			if (resolvedType === 'FLOAT' && value !== undefined) {
				let shouldInclude = false;

				if (isSpacingCollection) {
					// Include all FLOAT variables from "Spacing" collection
					shouldInclude = true;
				} else if (isPrimitivesCollection) {
					// Only include spacing-related variables from "Primitives" collection
					const nameParts = name.toLowerCase().split('/');
					shouldInclude = nameParts.some(part => 
						['spacing', 'space', 'gap', 'margin', 'padding', 'size'].includes(part)
					);
				}

				if (shouldInclude) {
					// Create a CSS var reference based on this variable's name
					// Convert underscores to hyphens and handle camelCase properly
					let namePartsForCss = name.split("/").map(part => 
						part.toLowerCase().replace(/_/g, '-')
					);
					
					// For variables from "Spacing" collection, prepend "spacing" to the CSS path
					// unless the variable name already starts with "spacing/"
					if (isSpacingCollection && !name.toLowerCase().startsWith('spacing/')) {
						namePartsForCss = ['spacing', ...namePartsForCss];
					}
					
					const spacingValue = buildCssVarReference(namePartsForCss);
					
					// Create a preset for this spacing value
					const preset: SpacingPreset = {
						name: nameToLabel(name),
						slug: nameToSlug(name),
						size: spacingValue
					};

					spacingPresets.push(preset);
				}
			}
		}
	}

	// Sort presets by name for consistent output
	return spacingPresets.sort((a, b) => a.name.localeCompare(b.name));
} 