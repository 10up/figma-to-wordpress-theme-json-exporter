console.clear();

import { ExportOptions } from './types';
import { exportToJSON } from './export/index';
import { getAllColorPresets } from './color/index';

figma.ui.onmessage = async (e) => {
	console.log("code received message", e);
	if (e.type === "EXPORT") {
		// Extract options from the message
		const options: ExportOptions = e.options || {};
		await exportToJSON(options);
	} else if (e.type === "GET_COLOR_PRESETS") {
		// Get all available color presets for the UI
		try {
			const colorPresets = await getAllColorPresets();
			figma.ui.postMessage({
				type: "COLOR_PRESETS_RESULT",
				colorPresets
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "COLOR_PRESETS_RESULT",
				error: error instanceof Error ? error.message : "Failed to get color presets"
			});
		}
	} else if (e.type === "RESIZE") {
		// Handle resize message from the UI
		if (e.width && e.height) {
			figma.ui.resize(
				Math.max(300, Math.round(e.width)),
				Math.max(300, Math.round(e.height))
			);
		}
	}
};

if (figma.command === "export") {
	figma.showUI(__uiFiles__["export"], {
		width: 500,
		height: 500,
		themeColors: true,
	});
}
