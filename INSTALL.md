# Installation Guide

## Installing the Plugin

### From Figma Community

1. Open Figma and navigate to the Community tab
2. Search for "WordPress Theme.json Export"
3. Click "Install" to add the plugin to your Figma workspace

### Manual Installation

If you're installing the plugin manually:

1. Download the plugin files from the repository
2. In Figma, go to Menu > Plugins > Development > Import plugin from manifest
3. Select the manifest.json file from the downloaded files

## Setting Up Your Figma Document

For the best results when using the WordPress Theme.json Exporter:

### Variable Collections

1. **Create a "Primitives" collection** - This collection will be used as the base for your theme.json file.
2. **Organize your variables in a hierarchical structure** - Use the slash (/) separator to create hierarchy in variable names (e.g., "color/primary/900").
3. **For responsive variables** - Create a collection with exactly two modes named "Desktop" and "Mobile".
4. **For color modes** - Create a "Color" collection with different modes for each color scheme.

### Text Styles

1. **Create text styles for your typography** - These will be exported as typography presets.
2. **Use meaningful names** - Name your text styles descriptively (e.g., "Heading/H1", "Body/Regular").
3. **Bind text properties to variables when possible** - The plugin will use variable references for bound properties.

## Exporting to theme.json

1. Open your Figma document with variables and text styles
2. Go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json
3. In the plugin UI, you can:
   - Choose to include typography presets (from text styles)
   - Preview the generated theme.json and additional style files
   - Download all files as a zip package

## Using the Generated Files in WordPress

1. Extract the downloaded zip file
2. Copy the `theme.json` file to the root of your WordPress theme
3. Copy the `styles` folder to the root of your WordPress theme
4. Your theme now has access to all the design tokens from Figma

## Features

### Typography Presets

The plugin automatically creates typography presets from your Figma text styles, with:
- Font family, size, weight, and line height properties
- Line height values converted from percentages (120%) to decimals (1.2)
- Proper text decoration handling for color, style, thickness, and offset

### Fluid Variables

For responsive variables (using Desktop and Mobile modes):
- Values are exported as fluid variables with min and max values
- The `fluid` property is set as `"true"` (string) for WordPress compatibility

### Color Modes

For color collections with multiple modes:
- Each mode is exported as a separate section file
- Files can be used for WordPress theme variations or block styles

### Button Variations

Button styles in your color collection are automatically:
- Extracted into separate style files
- Formatted for use as WordPress block styles

## Troubleshooting

If you encounter issues:

1. **Variables not exporting** - Make sure your variables are published and visible in the Variables panel.
2. **Text styles not appearing** - Check that your text styles are local to the document.
3. **Missing typography properties** - Some properties may be omitted if they contain invalid values.

For more help, please refer to the README.md file or open an issue on GitHub. 