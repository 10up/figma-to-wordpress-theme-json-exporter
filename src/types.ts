// Interface for export options
export interface ExportOptions {
	generateTypography?: boolean;
	generateColorPresets?: boolean;
	generateSpacingPresets?: boolean;
	baseTheme?: any;
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