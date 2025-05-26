console.clear();

import { ExportOptions } from './types';
import { exportToJSON } from './export/index';

figma.ui.onmessage = async (e) => {
	console.log("code received message", e);
	if (e.type === "EXPORT") {
		// Extract options from the message
		const options: ExportOptions = e.options || {};
		await exportToJSON(options);
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
