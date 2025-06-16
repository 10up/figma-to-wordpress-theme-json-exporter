import { buildWpCustomPropertyPath } from './css';

/**
 * Checks if a variable description already contains CSS var syntax
 */
export function hasCssVarSyntax(description: string): boolean {
	return description.includes('var(--wp--custom--');
}

/**
 * Extracts the original value from a CSS var description
 * Format: var(--wp--custom--xxx, originalValue)
 */
export function extractOriginalValue(description: string): string | null {
	const match = description.match(/var\(--wp--custom--[^,]+,\s*([^)]+)\)/);
	return match ? match[1].trim() : null;
}

/**
 * Generates CSS var syntax for a variable
 * Format: var(--wp--custom--xxx, originalValue)
 */
export function generateCssVarSyntax(nameParts: string[], originalValue: string): string {
	const cssVarPath = buildWpCustomPropertyPath(nameParts);
	return `var(${cssVarPath}, ${originalValue})`;
}

/**
 * Applies CSS var syntax to all variables in the current Figma file
 */
export async function applyCssVarSyntaxToVariables(options: { overwriteExisting: boolean }) {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	let updatedCount = 0;
	let skippedCount = 0;

	for (const collection of collections) {
		// Determine the collection prefix based on how the exporter handles collection names
		const collectionName = collection.name.toLowerCase();
		const isPrimitives = collectionName === "primitives";
		
		for (const variableId of collection.variableIds) {
			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			// Build the complete variable path including collection name (if not Primitives)
			const variableNameParts = variable.name.split("/").map(part => part.toLowerCase());
			const fullNameParts = isPrimitives 
				? variableNameParts  // Primitives go directly to custom without collection prefix
				: [collectionName, ...variableNameParts]; // Other collections include the collection name
			
			const currentWebSyntax = variable.codeSyntax?.WEB || '';
			
			// Check if we should skip this variable
			if (hasCssVarSyntax(currentWebSyntax) && !options.overwriteExisting) {
				skippedCount++;
				continue;
			}

			// Get the original value to use as fallback
			let originalValue = '';
			
			// If there's already CSS var syntax, extract the original value
			if (hasCssVarSyntax(currentWebSyntax)) {
				const extracted = extractOriginalValue(currentWebSyntax);
				originalValue = extracted || '';
			} else {
				// Use the current web code syntax as original value if it exists
				originalValue = currentWebSyntax || '';
			}

			// If originalValue is empty, try to get a better fallback
			if (!originalValue) {
				// For colors, try to get a representative value
				if (variable.resolvedType === 'COLOR') {
					// Get the first available value
					const firstMode = Object.keys(variable.valuesByMode)[0];
					if (firstMode) {
						const value = variable.valuesByMode[firstMode];
						if (value && typeof value === 'object' && 'r' in value) {
							// Convert RGB to hex as fallback
							const r = Math.round(value.r * 255);
							const g = Math.round(value.g * 255);
							const b = Math.round(value.b * 255);
							originalValue = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
						}
					}
				} else if (variable.resolvedType === 'FLOAT') {
					// For numbers, use the first available value
					const firstMode = Object.keys(variable.valuesByMode)[0];
					if (firstMode) {
						const value = variable.valuesByMode[firstMode];
						if (typeof value === 'number') {
							originalValue = `${value}px`;
						}
					}
				}
				
				// Final fallback
				if (!originalValue) {
					originalValue = 'inherit';
				}
			}

			// Generate the new CSS var syntax with the complete path
			const newCodeSyntax = generateCssVarSyntax(fullNameParts, originalValue);

			try {
				// Update the variable code syntax for the WEB platform
				variable.setVariableCodeSyntax('WEB', newCodeSyntax);
				updatedCount++;
			} catch (error) {
				console.error(`Error updating variable ${variable.name}:`, error);
			}
		}
	}

	return {
		updatedCount,
		skippedCount,
		totalProcessed: updatedCount + skippedCount
	};
} 