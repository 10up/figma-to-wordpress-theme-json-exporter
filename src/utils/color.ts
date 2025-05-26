// Fix the rgbToHex function to handle both direct RGB values and variable aliases
export function rgbToHex(color: any): string | null {
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

	const toHex = (value: number): string => {
		// Clamp value between 0-1
		const clampedValue = Math.max(0, Math.min(1, value));
		const hex = Math.round(clampedValue * 255).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	const hex = [toHex(r), toHex(g), toHex(b)].join("");
	return `#${hex}`;
} 