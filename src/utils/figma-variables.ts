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
 * Extracts the raw value from a Figma variable for use as a fallback
 */
function getVariableRawValue(variable: Variable): string {
	// Get the first available mode
	const firstMode = Object.keys(variable.valuesByMode)[0];
	if (!firstMode) {
		return 'inherit';
	}
	
	const value = variable.valuesByMode[firstMode];
	
	// Handle different variable types
	switch (variable.resolvedType) {
		case 'COLOR':
			if (value && typeof value === 'object' && 'r' in value) {
				// Convert RGB to hex
				const r = Math.round(value.r * 255);
				const g = Math.round(value.g * 255);
				const b = Math.round(value.b * 255);
				return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
			}
			break;
			
		case 'FLOAT':
			if (typeof value === 'number') {
				return `${value}px`;
			}
			break;
			
		case 'STRING':
			if (typeof value === 'string') {
				return value;
			}
			break;
			
		case 'BOOLEAN':
			if (typeof value === 'boolean') {
				return value.toString();
			}
			break;
			
		default:
			// Handle variable aliases and other types
			if (value && typeof value === 'object' && 'id' in value) {
				// This is a variable alias - we could resolve it, but for fallback purposes
				// we'll use a generic value. In practice, the alias should resolve to the actual value.
				return 'inherit';
			}
			
			// For any other type, try to stringify the value
			if (value !== null && value !== undefined) {
				return String(value);
			}
			break;
	}
	
	// Final fallback
	return 'inherit';
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

			// If originalValue is empty, extract the actual raw value from the variable
			if (!originalValue) {
				originalValue = getVariableRawValue(variable);
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