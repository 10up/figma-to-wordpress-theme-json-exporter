// Helper function to check if a value appears to be a variable alias
export function isVariableAlias(value: any): boolean {
	return value && typeof value === 'object' && value.type === "VARIABLE_ALIAS";
}

// Helper function to merge collection data into the base theme at the appropriate location
export function mergeCollectionData(baseTheme: any, collectionName: string, collectionData: any): void {
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
export function deepMerge(target: any, source: any): any {
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

// Helper function to determine if a value should have 'px' units appended
export function shouldAddPxUnit(nameParts: string[], value: any): boolean {
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
export function formatValueWithUnits(nameParts: string[], value: any): any {
	if (shouldAddPxUnit(nameParts, value)) {
		return `${value}px`;
	}
	return value;
}

// Helper function to round numbers nicely with max 3 decimal places
export function roundToMax3Decimals(value: number): number | string {
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

// Helper function to capitalize the first letter of a string
export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
} 