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
5. **For spacing variables** - Create a "Spacing" collection or include spacing variables in your "Primitives" collection.

### Text Styles

1. **Create text styles for your typography** - These will be exported as typography presets.
2. **Use meaningful names** - Name your text styles descriptively (e.g., "Heading/H1", "Body/Regular").
3. **Bind text properties to variables when possible** - The plugin will use variable references for bound properties.

### Color Variables

1. **Organize color variables** - Group related colors using hierarchical naming (e.g., "color/primary", "color/secondary").
2. **Use semantic naming** - Name colors by their purpose rather than their appearance (e.g., "primary" instead of "blue").
3. **Create color modes** - Use multiple modes in your Color collection for different themes (light/dark).

### Spacing Variables

1. **Use descriptive naming** - Include keywords like "spacing", "gap", "margin", "padding", or "size".
2. **Create fluid spacing** - Use the pattern `MAX_MIN` (e.g., `24_16`) for responsive spacing values.
3. **Organize hierarchically** - Use forward slashes to create spacing scales (e.g., "spacing/small", "spacing/large").

## Exporting to theme.json

1. Open your Figma document with variables and text styles
2. Go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json
3. In the plugin UI, you can:
   - Choose to include typography presets (from text styles)
   - Generate color presets with customizable selection
   - Generate spacing presets from spacing variables
   - Upload an existing theme.json file to merge variables into it
   - Preview the generated theme.json and additional style files
   - Download all files as a zip package

### Plugin Interface Features

- **Resizable Interface**: Drag the resize handle in the bottom-right corner to adjust the plugin window size for better workflow integration
- **File Preview**: View all generated files with proper formatting and syntax highlighting
- **Copy Functionality**: Copy individual file contents to clipboard with one click
- **Multi-file Download**: Automatic zip packaging when multiple files are generated

### Export Options

#### Typography Presets
- Check "Generate typography presets from text styles"
- Converts all local text styles in your document to WordPress typography presets
- Automatically handles line height conversion and text decoration properties

#### Color Presets
- Check "Generate color presets from color variables"
- Click "Customize" to open the color selection modal
- Select specific colors from your collections
- Preview actual color values and organize by collection
- Use collection toggles for quick selection

#### Spacing Presets
- Check "Generate spacing presets from spacing variables"
- Automatically detects spacing-related variables
- Handles fluid spacing patterns and semantic naming
- Creates WordPress spacing presets for the block editor

### Using an Existing theme.json

If you want to merge Figma variables into an existing theme:

1. Prepare your existing theme.json file
2. In the plugin UI, locate the "Base theme.json" section
3. Click "Choose File" and select your theme.json file
4. The file name will appear when successfully loaded
5. Click "Export Variables" to merge your Figma variables into the theme
6. All existing theme settings will be preserved, with new variables added under settings.custom

## Using the Generated Files in WordPress

1. Extract the downloaded zip file
2. Copy the `theme.json` file to the root of your WordPress theme
3. Copy the `styles` folder (if present) to the root of your WordPress theme
4. Your theme now has access to all the design tokens from Figma

### WordPress Integration

The generated files provide:

- **Custom variables** under `settings.custom` for use in CSS
- **Typography presets** available in the block editor's typography controls
- **Color presets** available in the block editor's color picker
- **Spacing presets** available in the block editor's spacing controls
- **Style variations** for sections and buttons (if applicable)

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
4. **Base theme not loading** - Ensure your theme.json file is valid JSON and follows the WordPress theme.json schema.

For more help, please refer to the README.md file or open an issue on GitHub. 