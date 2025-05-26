// Helper function to convert camelCase to kebab-case
export function camelToKebabCase(value: string): string {
	return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to build a WordPress custom property path
export function buildWpCustomPropertyPath(nameParts: string[]): string {
	// Convert each part to lowercase and then kebab case
	const kebabParts = nameParts.map(part => camelToKebabCase(part.toLowerCase()));
	// Join with -- and prefix with --wp--custom--
	return `--wp--custom--${kebabParts.join('--')}`;
}

// Helper function to build a CSS var() reference
export function buildCssVarReference(nameParts: string[]): string {
	return `var(${buildWpCustomPropertyPath(nameParts)})`;
} 