import { capitalizeFirstLetter } from '../utils/index';

// Array to track which button variants we've already processed
// This needs to be outside of the function to persist between calls
const processedButtonVariants = new Set<string>();

// Helper function to process button styles in the color data
export function processButtonStyles(buttonData: Record<string, any>, allFiles: any[]): void {
	// First, check if we have a "primary" button style
	if (!buttonData.primary) {
		// If there's no primary button style, we don't need special processing
		return;
	}

	// Define known button variant names (case-insensitive)
	// This ensures we only generate files for main button variants
	const knownButtonVariants = ['secondary', 'tertiary', 'outline', 'ghost', 'link', 'destructive'];

	// Filter to only include direct child keys that match known button variant names
	const buttonVariants = Object.keys(buttonData).filter(key => {
		const keyLower = key.toLowerCase();
		return (
			// Skip primary as we don't want a file for it
			keyLower !== 'primary' &&
			// Match against our known button variant names (exact match or contains the variant name)
			(knownButtonVariants.includes(keyLower) || 
			 knownButtonVariants.some(variant => keyLower.includes(variant))) &&
			// Only include if it's a direct property (not inherited)
			Object.prototype.hasOwnProperty.call(buttonData, key) &&
			// Make sure it's an object (not a primitive value)
			typeof buttonData[key] === 'object' &&
			// Skip variants we've already processed to avoid duplicates
			!processedButtonVariants.has(keyLower)
		);
	});

	// Define button states for processing
	const buttonStates = ['default', 'hover', 'disabled'];

	// Only add default state properties when there are other button variants
	// This prevents adding default states when only primary button exists
	if (buttonVariants.length > 0) {
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
	}

	// Process each button variant as a separate file
	for (const variantName of buttonVariants) {
		const variantLower = variantName.toLowerCase();

		// Mark this variant as processed
		processedButtonVariants.add(variantLower);

		// Create a separate style file for each button variant
		const variantSlug = variantLower.replace(/\s+/g, '-');

		// Create flattened structure that references the variant's CSS custom properties
		const flattenedButtonSettings: Record<string, any> = {};

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

// Function to clear processed button variants (called at the start of export)
export function clearProcessedButtonVariants(): void {
	processedButtonVariants.clear();
} 