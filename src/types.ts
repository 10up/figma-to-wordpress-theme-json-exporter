// Interface for export options
export interface ExportOptions {
	generateTypography?: boolean;
	generateColorPresets?: boolean;
	generateSpacingPresets?: boolean;
	baseTheme?: any;
	selectedColors?: string[]; // Array of color variable IDs to include in presets
}

// TypeScript interface for Figma Variable Collection Mode
export interface VariableCollectionMode {
	modeId: string;
	name: string;
}

// Interface for Figma Variable Collection
export interface VariableCollection {
	name: string;
	modes: VariableCollectionMode[];
	variableIds: string[];
}

// Interface for color preset data used in the UI
export interface ColorPresetData {
	id: string;
	name: string;
	slug: string;
	color: string;
	collectionName: string;
	resolvedColor?: string; // Actual hex/rgb value for preview
} 