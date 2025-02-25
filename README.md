# WordPress Theme.json Exporter for Figma

This Figma plugin converts Figma design tokens/variables into WordPress theme.json format, placing all variables under the `settings.custom` section according to WordPress standards.

## Features

- Export Figma variables (colors, numbers) into WordPress theme.json format
- Properly structures data according to WordPress theme.json specification
- Converts variable references to CSS custom properties using WordPress naming convention
- Maintains variable hierarchies and references
- Supports downloading the generated theme.json file directly

## Usage

1. **To export Figma variables to theme.json:**
   - Go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json
   - View the generated theme.json in the plugin UI
   - Click "Download theme.json" to save the file

2. **To import variables:**
   - Go to Menu > Plugins > WordPress Theme.json Export > Import Variables
   - Paste your JSON structure and provide a collection name
   - Click Import Variables

## WordPress theme.json Structure

The plugin generates a valid WordPress theme.json file with all variables placed under the `settings.custom` section:

```json
{
  "version": 3,
  "settings": {
    "custom": {
      "color": {
        "primary": "#000000",
        "secondary": "#ffffff",
        "accent": "var(--wp--custom--color--primary)"
      },
      "spacing": {
        "base": 8,
        "large": 24
      }
    }
  }
}
```

### CSS Custom Properties

The plugin automatically converts references between variables to WordPress CSS custom property format. According to WordPress conventions:

- All custom properties are prefixed with `--wp--custom--`
- Each level of nesting adds another `--` separator
- CamelCase names are converted to kebab-case (lowercase with hyphens)

For example:
```
settings.custom.colorPalette.brandAccent → var(--wp--custom--color-palette--brand-accent)
```

This ensures that your theme.json file follows WordPress best practices and that all variable references will work correctly in your theme.

For more information on the WordPress theme.json format, see the [WordPress documentation](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/).

## Development

This plugin uses TypeScript and the Figma Plugin API. To develop:

1. Install dependencies: `npm install`
2. Watch for changes: `npm run watch`
3. Edit the code in `code.ts`

The plugin will automatically transpile TypeScript to JavaScript.
