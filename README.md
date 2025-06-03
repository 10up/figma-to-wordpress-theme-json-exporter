# WordPress Theme.json Exporter for Figma

[![Support Level](https://img.shields.io/badge/support-beta-blueviolet.svg)](#support-level) [![MIT License](https://img.shields.io/github/license/10up/10up-block-theme-json-export.svg)](https://github.com/10up/figma-to-wordpress-theme-json-exporter/blob/develop/LICENSE.md)

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
- **Typography presets** - Convert Figma text styles to WordPress typography presets *(10up tooling feature)*
- **Color presets** - Generate WordPress color palette from Figma color variables with customizable selection
- **Spacing presets** - Create WordPress spacing presets from Figma spacing variables
- Line height values converted from percentage to decimal format (e.g., 120% → 1.2)
- Text decoration properties with proper color, thickness, and offset handling
- Omits empty or invalid properties rather than using fallbacks
- **Resizable plugin interface** for better workflow integration
- **Multi-file export** with automatic zip packaging for complex themes

## Usage

### Basic Export

1. **To export Figma variables to theme.json:**
   - Go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json
   - Optionally upload an existing theme.json file to merge variables into it
   - Configure export options (typography, color presets, spacing presets)
   - Click "Export Variables" to generate the theme files
   - View the generated theme.json and additional style files in the plugin UI
   - Click "Download Theme Files" to save all files as a zip package

### Advanced Options

2. **To merge with an existing theme.json:**
   - Click "Choose File" in the Base theme.json section
   - Select your existing theme.json file
   - The plugin will merge your Figma variables into the existing theme structure
   - All existing theme.json settings and styles will be preserved
   - New variables will be added under settings.custom

3. **Typography Presets:** *(10up tooling feature)*
   - Check "Generate typography presets from text styles"
   - The plugin will convert all local text styles in your Figma document
   - Typography presets are added to `settings.custom.typography.presets`
   - See [TYPOGRAPHY-GUIDE.md](TYPOGRAPHY-GUIDE.md) for detailed information

4. **Color Presets:**
   - Check "Generate color presets from color variables"
   - Click "Customize" to select specific colors from your collections
   - Use the color selection modal to choose which variables to include
   - Color presets are added to `settings.color.palette`
   - Supports preview of actual color values and organized by collection
   - See [COLOR-PRESETS-GUIDE.md](COLOR-PRESETS-GUIDE.md) for detailed information

5. **Spacing Presets:**
   - Check "Generate spacing presets from spacing variables"
   - The plugin automatically detects spacing-related variables
   - Spacing presets are added to `settings.spacing.spacingSizes`
   - See [SPACING-GUIDE.md](SPACING-GUIDE.md) for detailed information

### Plugin Interface Features

- **Resizable Interface**: Drag the resize handle in the bottom-right corner to adjust plugin size
- **File Preview**: View generated files with syntax highlighting and copy functionality
- **Multi-file Download**: Automatic zip packaging when multiple files are generated
- **Error Handling**: Clear error messages and validation feedback

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

### Responsive/Fluid Variables *(10up tooling feature)*

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

## Color Presets

The plugin can generate WordPress color presets from your Figma color variables, making them available in the WordPress block editor's color picker. For comprehensive information about this feature, see [COLOR-PRESETS-GUIDE.md](COLOR-PRESETS-GUIDE.md).

### Quick Overview

- Processes color variables from all collections except "Primitives"
- Customizable selection through an interactive modal interface
- Organized by collection with visual color previews
- Creates WordPress color presets under `settings.color.palette`

## Spacing Presets

The plugin automatically generates WordPress spacing presets from Figma spacing variables. For detailed information about spacing presets, see [SPACING-GUIDE.md](SPACING-GUIDE.md).

### Quick Overview

- Processes variables from "Spacing" and "Primitives" collections
- Automatically detects spacing-related keywords (spacing, gap, margin, padding, size)
- Special handling for fluid spacing variables (e.g., `24_16` becomes "Fluid (16 → 24)")
- Creates WordPress spacing presets under `settings.spacing.spacingSizes`

## Output Files

The plugin generates several types of files depending on your configuration and Figma setup:

### Core Files

1. **Main theme.json**
   - Contains the base theme settings from the "Primitives" collection
   - Includes the first mode of the "Color" collection
   - Contains all custom variables under `settings.custom`
   - Includes typography, color, and spacing presets if enabled

### Style Variation Files

2. **Section Files** (when applicable)
   - Located in the "styles" directory
   - File naming: `section-{mode-name}.json`
   - Generated for Color collections with multiple modes
   - Each file represents a color mode that can be applied to groups or sections
   - Includes proper WordPress theme variation metadata

3. **Button Style Files** (when applicable)
   - Located in the "styles" directory
   - File naming: `button-{variant-name}.json`
   - Generated when button variants are found in the Color collection
   - Each file represents a button style variant for WordPress block styles
   - Includes proper WordPress block style variation metadata

### File Generation Logic

- **Single file**: When only basic variables are exported without additional modes or button variants
- **Multiple files**: When Color collections have multiple modes or button variants are detected
- **Automatic zip packaging**: When multiple files are generated, they're automatically packaged into a zip file for download

### File Structure Example

For a complex setup, you might get:
```
wordpress-theme-files.zip
├── theme.json                    # Main theme file
└── styles/
    ├── section-light.json        # Light color mode
    ├── section-dark.json         # Dark color mode
    ├── button-secondary.json     # Secondary button variant
    └── button-tertiary.json      # Tertiary button variant
```

All files are packed into a single zip download for easy use in WordPress themes.

## Detailed Guides

For comprehensive information on specific features, see these detailed guides:

- **[INSTALL.md](INSTALL.md)** - Complete installation and setup instructions
- **[TYPOGRAPHY-GUIDE.md](TYPOGRAPHY-GUIDE.md)** - Typography presets and text style conversion
- **[COLOR-PRESETS-GUIDE.md](COLOR-PRESETS-GUIDE.md)** - Color presets and customization modal
- **[SPACING-GUIDE.md](SPACING-GUIDE.md)** - Spacing presets and variable detection
- **[FLUID-VARIABLES-GUIDE.md](FLUID-VARIABLES-GUIDE.md)** - Responsive/fluid variables setup

## Development

This plugin uses TypeScript and the Figma Plugin API. To develop:

1. Install dependencies: `npm install`
2. Watch for changes: `npm run watch`
3. Edit the code in `code.ts`

The plugin will automatically transpile TypeScript to JavaScript.

## Support Level

**Beta:** This project is quite new and we're not sure what our ongoing support level for this will be.  Bug reports, feature requests, questions, and pull requests are welcome.  If you like this project please let us know, but be cautious using this in a Production environment!

## Changelog

A complete listing of all notable changes to this project are documented in [CHANGELOG.md](https://github.com/10up/figma-to-wordpress-theme-json-exporter/blob/develop/CHANGELOG.md).

## Contributing with Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation. When contributing, you'll need to include a changeset with your pull request.

### Adding a Changeset

When you make changes that should be released, run:

```bash
npm run changeset
```

This will prompt you to:
1. Select which packages should be bumped (for this single-package repo, select the main package)
2. Choose the type of change (patch, minor, or major)
3. Write a summary of your changes

The changeset will be saved as a file in the `.changeset` directory and should be committed with your changes.

### Types of Changes

- **Patch** (0.0.X): Bug fixes, documentation updates, internal changes
- **Minor** (0.X.0): New features, enhancements that don't break existing functionality  
- **Major** (X.0.0): Breaking changes that require users to update their code

### Changeset Requirements

- All pull requests must include a changeset (except for changes that don't affect the published package)
- The CI will automatically check for changesets and fail if one is missing
- If your change doesn't warrant a release (e.g., updating README, tests, or CI), you can create an empty changeset by running `npm run changeset` and selecting no packages to bump

### Release Process

When changesets are merged to the main branch:
1. A "Release" pull request will be automatically created
2. This PR will update the version number and changelog
3. When the Release PR is merged, the package will be automatically published to npm

## Contributing

Please read [CODE_OF_CONDUCT.md](https://github.com/10up/figma-to-wordpress-theme-json-exporter/blob/develop/CODE_OF_CONDUCT.md) for details on our code of conduct, [CONTRIBUTING.md](https://github.com/10up/figma-to-wordpress-theme-json-exporter/blob/develop/CONTRIBUTING.md) for details on the process for submitting pull requests to us, and [CREDITS.md](https://github.com/10up/figma-to-wordpress-theme-json-exporter/blob/develop/CREDITS.md) for a listing of maintainers, contributors, and libraries for this project.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://fueled.com/wp-content/uploads/2025/06/10up-github-banner.webp" alt="Work with the 10up WordPress Practice at Fueled"></a>
