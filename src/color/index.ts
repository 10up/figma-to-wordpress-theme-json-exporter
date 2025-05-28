import { rgbToHex } from '../utils/color';
import { isVariableAlias } from '../utils/index';
import { buildCssVarReference } from '../utils/css';
import { ColorPresetData } from '../types';

interface ColorPreset {
	name: string;
	slug: string;
	color: string;
}

/**
 * Converts a variable name to a WordPress-compatible slug
 */
function nameToSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Converts a variable name to a human-readable name
 */
function nameToLabel(name: string): string {
	return name
		.split(/[/\-_\s]+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Gets all available color presets for UI display
 */
export async function getAllColorPresets(): Promise<ColorPresetData[]> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const colorPresets: ColorPresetData[] = [];

	for (const collection of collections) {
		// Process all collections except "Primitives"
		const collectionName = collection.name.toLowerCase();
		if (collectionName === 'primitives') {
			continue;
		}

		// Use the first mode for color presets
		const mode = collection.modes[0];
		if (!mode) continue;

		for (const variableId of collection.variableIds) {
			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			const { name, resolvedType, valuesByMode } = variable;
			const value = valuesByMode[mode.modeId];

			// Process color variables (both direct values and aliases)
			if (resolvedType === 'COLOR' && value !== undefined) {
				// Always create a CSS var reference based on this variable's own name
				const nameParts = name.split("/").map(part => part.toLowerCase());
				const colorValue = buildCssVarReference(['color', ...nameParts]);
				
				// Resolve the actual color value for preview
				let resolvedColor: string | undefined;
				if (isVariableAlias(value)) {
					// For aliases, we'll try to resolve the referenced variable
					const referencedVariable = await figma.variables.getVariableByIdAsync((value as any).id);
					if (referencedVariable) {
						const referencedValue = referencedVariable.valuesByMode[Object.keys(referencedVariable.valuesByMode)[0]];
						if (referencedValue && !isVariableAlias(referencedValue)) {
							const hexValue = rgbToHex(referencedValue as RGB);
							resolvedColor = hexValue || undefined;
						}
					}
				} else {
					const hexValue = rgbToHex(value as RGB);
					resolvedColor = hexValue || undefined;
				}
				
				// Create a preset for this color
				const preset: ColorPresetData = {
					id: variableId,
					name: nameToLabel(name),
					slug: nameToSlug(name),
					color: colorValue,
					collectionName: collection.name,
					resolvedColor
				};

				colorPresets.push(preset);
			}
		}
	}

	// Sort presets by collection name, then by name for consistent output
	return colorPresets.sort((a, b) => {
		const collectionCompare = a.collectionName.localeCompare(b.collectionName);
		if (collectionCompare !== 0) return collectionCompare;
		return a.name.localeCompare(b.name);
	});
}

/**
 * Generates color presets from Figma color variables
 */
export async function getColorPresets(selectedColorIds?: string[]): Promise<ColorPreset[]> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const colorPresets: ColorPreset[] = [];

	for (const collection of collections) {
		// Process all collections except "Primitives"
		const collectionName = collection.name.toLowerCase();
		if (collectionName === 'primitives') {
			continue;
		}

		// Use the first mode for color presets
		const mode = collection.modes[0];
		if (!mode) continue;

		for (const variableId of collection.variableIds) {
			// If selectedColorIds is provided, only process selected colors
			if (selectedColorIds && !selectedColorIds.includes(variableId)) {
				continue;
			}

			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			const { name, resolvedType, valuesByMode } = variable;
			const value = valuesByMode[mode.modeId];

			// Process color variables (both direct values and aliases)
			if (resolvedType === 'COLOR' && value !== undefined) {
				// Always create a CSS var reference based on this variable's own name
				// This ensures we reference the semantic color name, not the primitive it might resolve to
				const nameParts = name.split("/").map(part => part.toLowerCase());
				const colorValue = buildCssVarReference(['color', ...nameParts]);
				
				// Create a preset for this color
				const preset: ColorPreset = {
					name: nameToLabel(name),
					slug: nameToSlug(name),
					color: colorValue
				};

				colorPresets.push(preset);
			}
		}
	}

	// Sort presets by name for consistent output
	return colorPresets.sort((a, b) => a.name.localeCompare(b.name));
} 