import { VariableCollection, VariableCollectionMode, ExportOptions } from '../types';
import { isVariableAlias, formatValueWithUnits } from '../utils/index';
import { buildCssVarReference } from '../utils/css';
import { rgbToHex } from '../utils/color';

// New helper function to process a specific mode of a collection
export async function processCollectionModeData(collection: VariableCollection, mode: VariableCollectionMode, options?: ExportOptions) {
	const { variableIds } = collection;
	const variablesData: Record<string, any> = {};

	for (const variableId of variableIds) {
		const variable = await figma.variables.getVariableByIdAsync(variableId);
		if (!variable) continue;

		const { name, resolvedType, valuesByMode } = variable;
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
				if (currentVar) {
					// Convert the reference to a CSS custom property reference with lowercase parts
					const referenceParts = currentVar.name.split("/").map(part => part.toLowerCase());
					obj[leafName] = buildCssVarReference(referenceParts);
				}
			} else {
				obj[leafName] = resolvedType === "COLOR" ?
					rgbToHex(value) :
					formatValueWithUnits(nameParts, value, options?.useRem, options?.remCollections);
			}
		}
	}

	return variablesData;
}

// Update processCollectionData to use the new helper function
export async function processCollectionData({ name, modes, variableIds }: VariableCollection, options?: ExportOptions) {
	// Check if this collection has exactly two modes named "Desktop" and "Mobile"
	const isFluidCollection = modes.length === 2 &&
		modes.some(mode => mode.name.toLowerCase() === "desktop") &&
		modes.some(mode => mode.name.toLowerCase() === "mobile");

	if (isFluidCollection) {
		// Handle fluid responsive collection
		// Find the Desktop and Mobile mode IDs
		const desktopMode = modes.find(mode => mode.name.toLowerCase() === "desktop");
		const mobileMode = modes.find(mode => mode.name.toLowerCase() === "mobile");
		
		if (!desktopMode || !mobileMode) {
			// Fallback to first mode if desktop/mobile not found
			return await processCollectionModeData(
				{ name, modes, variableIds } as VariableCollection,
				modes[0],
				options
			);
		}

		const desktopModeId = desktopMode.modeId;
		const mobileModeId = mobileMode.modeId;

		// Create a temporary object to hold our variable structure
		const variablesData: Record<string, any> = {};

		// Process all variables
		for (const variableId of variableIds) {
			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			const { name, resolvedType, valuesByMode } = variable;

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

					if (desktopVar && mobileVar) {
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
					}
				} else if (isVariableAlias(desktopValue) || isVariableAlias(mobileValue)) {
					// Only one is a reference, the other is a direct value
					if (isVariableAlias(desktopValue)) {
						const desktopVar = await figma.variables.getVariableByIdAsync((desktopValue as any).id);
						if (desktopVar) {
							const desktopReferenceParts = desktopVar.name.split("/").map(part => part.toLowerCase());
							obj[leafName] = buildCssVarReference(desktopReferenceParts);
						}
					} else {
						obj[leafName] = resolvedType === "COLOR" ?
							rgbToHex(desktopValue) :
							formatValueWithUnits(nameParts, desktopValue, options?.useRem, options?.remCollections);
					}
				} else {
					// Both are direct values
					const maxValue = resolvedType === "COLOR" ?
						rgbToHex(desktopValue) :
						formatValueWithUnits(nameParts, desktopValue, options?.useRem, options?.remCollections);
					const minValue = resolvedType === "COLOR" ?
						rgbToHex(mobileValue) :
						formatValueWithUnits(nameParts, mobileValue, options?.useRem, options?.remCollections);

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
			modes[0],
			options
		);
	}
} 