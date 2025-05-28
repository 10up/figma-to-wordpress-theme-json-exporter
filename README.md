# WordPress Theme.json Exporter for Figma

[![MIT License](https://img.shields.io/github/license/10up/ui-kit-figma-variable-export.svg)](https://github.com/10up/ui-kit-figma-variable-export/blob/develop/LICENSE.md)

> This Figma plugin converts Figma design tokens/variables into WordPress theme.json format, placing all variables under the `settings.custom` section according to WordPress standards.

## Features

- Export Figma variables (colors, numbers) into WordPress theme.json format
- Merge variables into an existing theme.json file
- Properly structures data according to WordPress theme.json specification
- Converts variable references to CSS custom properties using WordPress naming convention
- Maintains variable hierarchies and references
- Special handling for color modes and sections
- Automatic generation of button variant style files
- Support for responsive/fluid variables
- Automatic unit handling (px) for specific value types
- Supports downloading the generated files as a zip package
- Typography handling with text styles to theme.json conversion
- Line height values converted from percentage to decimal format (e.g., 120% → 1.2)
- Text decoration properties with proper color, thickness, and offset handling
- Omits empty or invalid properties rather than using fallbacks

## Usage

1. **To export Figma variables to theme.json:**
   - Go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json
   - Optionally upload an existing theme.json file to merge variables into it
   - Enable typography preset generation if needed
   - Click "Export Variables" to generate the theme files
   - View the generated theme.json and additional style files in the plugin UI
   - Click "Download Theme Files" to save all files as a zip package

2. **To merge with an existing theme.json:**
   - Click "Choose File" in the Base theme.json section
   - Select your existing theme.json file
   - The plugin will merge your Figma variables into the existing theme structure
   - All existing theme.json settings and styles will be preserved
   - New variables will be added under settings.custom

3. **To import variables:**
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
        "accent": "var(--wp--custom--color--primary)",
        "button": {
          "default": {
            "background": "var(--wp--custom--color--button--primary--default--background)",
            "text": "var(--wp--custom--color--button--primary--default--text)"
          },
          "hover": {
            "background": "var(--wp--custom--color--button--primary--hover--background)",
            "text": "var(--wp--custom--color--button--primary--hover--text)"
          }
        }
      },
      "spacing": {
        "base": "8px",
        "large": "24px"
      }
    }
  }
}
```

### Base Theme Merging

When uploading an existing theme.json file:
- The plugin preserves all existing theme settings and styles
- New variables from Figma are merged into the `settings.custom` section
- Existing custom variables with the same name are updated with new values
- Other sections of the theme.json file remain untouched
- Color modes and button styles are still exported as separate files

### Special Collection Handling

The plugin provides special handling for certain Figma variable collections:

#### Primitives Collection

Variables from a collection named "Primitives" are used as the base theme and are always processed first.

#### Color Collection with Multiple Modes

If a collection named "Color" has multiple modes:
- The first mode is merged into the main theme.json
- Each mode (including the first) is also exported as a separate file: `styles/section-{mode-name}.json`
- These files include proper metadata for WordPress theme variations

#### Button Styles

When the "Color" collection includes a "button" group with variants:
- Button variant properties from the primary button are referenced at the root level with CSS variables
- Each non-primary button variant (e.g., secondary, tertiary, etc.) is exported as a separate file: `styles/button-{variant-name}.json`
- These files include proper metadata for WordPress block style variations

### Typography Handling

The plugin can generate typography presets from Figma text styles:

- Font family, size, weight, and line height are extracted from text styles
- Line height values in percentage format (120%) are automatically converted to decimal format (1.2) as required by WordPress
- Text decoration properties (color, style, thickness, offset) are properly handled
- The plugin omits empty or invalid properties rather than using fallbacks to ensure clean output

### Responsive/Fluid Variables

If a collection has exactly two modes named "Desktop" and "Mobile", the plugin treats them as responsive variables:

```json
{
  "spacing": {
    "base": {
      "fluid": "true",
      "min": "8px",
      "max": "16px"
    }
  }
}
```

Note: The "fluid" property is output as a string value "true" rather than a boolean to ensure compatibility with WordPress theme.json parsing.

### Units Handling

The plugin automatically adds "px" units to numeric values in appropriate categories:
- spacing
- font
- size
- grid
- radius
- width
- height

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

## Output Files

The plugin generates several types of files:

1. **Main theme.json**
   - Contains the base theme settings from the "Primitives" collection
   - Includes the first mode of the "Color" collection

2. **Section Files**
   - Located in the "styles" directory
   - File naming: `section-{mode-name}.json`
   - Each file represents a color mode that can be applied to groups or sections

3. **Button Style Files**
   - Located in the "styles" directory
   - File naming: `button-{variant-name}.json`
   - Each file represents a button style variant that can be applied to buttons

All files are packed into a single zip download for easy use in WordPress.

## Development

This plugin uses TypeScript and the Figma Plugin API. To develop:

1. Install dependencies: `npm install`
2. Watch for changes: `npm run watch`
3. Edit the code in `code.ts`

The plugin will automatically transpile TypeScript to JavaScript.

## Changelog

A complete listing of all notable changes to ClassifAI are documented in [CHANGELOG.md](https://github.com/10up/ui-kit-figma-variable-export/blob/develop/CHANGELOG.md).

## Contributing

Please read [CODE_OF_CONDUCT.md](https://github.com/10up/ui-kit-figma-variable-export/blob/develop/CODE_OF_CONDUCT.md) for details on our code of conduct, [CONTRIBUTING.md](https://github.com/10up/ui-kit-figma-variable-export/blob/develop/CONTRIBUTING.md) for details on the process for submitting pull requests to us, and [CREDITS.md](https://github.com/10up/ui-kit-figma-variable-export/blob/develop/CREDITS.md) for a listing of maintainers, contributors, and libraries for this project.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850" alt="Work with us at 10up"></a>
