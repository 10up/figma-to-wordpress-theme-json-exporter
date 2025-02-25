// This plugin will generate a sample codegen plugin
// that appears in the Element tab of the Inspect panel.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// // Get all local variables
// async function getAllLocalVariables() {
//   const collections = await figma.variables.getLocalVariableCollectionsAsync();
//   const variables: {[key: string]: any} = {};

//   for (const collection of collections) {
//     const variables = collection.variableIds.map(id => 
//       figma.variables.getVariableById(id)
//     ).filter((v): v is Variable => v !== null);
    
//     for (const variable of variables) {
//       const modes = variable.valuesByMode;
//       const defaultMode = collection.defaultModeId;
//       const value = modes[defaultMode];
      
//       // Create nested object structure based on variable name
//       const path = variable.name.split('/').map((segment: string) => 
//         segment.trim().toLowerCase().replace(/\s+/g, '-')
//       );
      
//       let current: Record<string, any> = variables;
//       path.forEach((segment: string, index: number) => {
//         if (index === path.length - 1) {
//           current[segment] = value;
//         } else {
//           current[segment] = current[segment] || {};
//           current = current[segment];
//         }
//       });
//     }
//   }

//   return variables;
// }

// // Generate theme.json content
// function generateThemeJson(variables: any) {
//   return {
//     "version": 3,
//     "settings": {
//       "custom": variables
//     }
//   };
// }

// // Main plugin logic
// figma.ui.onmessage = async (msg) => {
//   if (msg.type === 'generate') {
//     const variables = await getAllLocalVariables();
//     const themeJson = generateThemeJson(variables);
    
//     // Send the theme.json content back to the UI
//     figma.ui.postMessage({
//       type: 'theme-json',
//       content: JSON.stringify(themeJson, null, 2)
//     });
//   }

//   // Make sure to close the plugin when we're done. 
//   if (msg.type === 'close') {
//     figma.closePlugin();
//   }
// };
