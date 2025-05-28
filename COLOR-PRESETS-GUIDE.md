# Color Presets Guide

This guide provides detailed information on how to use the color presets feature in the WordPress Theme.json Exporter plugin.

## What Are Color Presets?

Color presets in WordPress allow you to define a set of predefined colors that appear in the WordPress block editor's color picker. These presets make it easy for content creators to apply consistent brand colors throughout their content.

The WordPress Theme.json Exporter plugin automatically converts Figma color variables into WordPress color presets in the theme.json format.

## Setting Up Color Variables in Figma

1. **Create variable collections** with color-related variables
2. **Use semantic naming** that describes the color's purpose rather than its appearance:
   - `color/primary` instead of `color/blue`
   - `color/secondary` instead of `color/green`
   - `color/accent` instead of `color/orange`
3. **Use COLOR type variables** for color values
4. **Organize hierarchically** using forward slashes (e.g., "color/text/primary", "color/background/secondary")
5. **Create color modes** for different themes (light/dark) using multiple modes in your Color collection

## Supported Variable Types

The plugin processes COLOR variables from all collections except the "Primitives" collection:

| Collection Type | Processing | Example Variables |
|----------------|------------|-------------------|
| Color | All COLOR variables processed | `primary`, `secondary`, `accent` |
| Design System | All COLOR variables processed | `brand/primary`, `ui/background` |
| Layout | All COLOR variables processed | `surface/light`, `border/default` |
| Primitives | **Excluded** from color presets | Used for base theme variables only |

## How Color Presets Are Exported

The plugin automatically detects COLOR variables and exports them as color presets with the following structure:

```json
{
  "settings": {
    "color": {
      "palette": [
        {
          "name": "Primary",
          "slug": "primary",
          "color": "var(--wp--custom--color--primary)"
        },
        {
          "name": "Secondary",
          "slug": "secondary",
          "color": "var(--wp--custom--color--secondary)"
        },
        {
          "name": "Brand Accent",
          "slug": "brand-accent",
          "color": "var(--wp--custom--color--brand--accent)"
        }
      ]
    }
  }
}
```

## Variable Name Processing

The plugin processes variable names to create user-friendly labels and slugs:

### Name to Label Conversion
- `primary` → "Primary"
- `color/secondary` → "Secondary"
- `brand/accent-color` → "Brand Accent Color"
- `ui/background_light` → "Ui Background Light"
- `text/heading-primary` → "Text Heading Primary"

### Name to Slug Conversion
- `primary` → "primary"
- `color/secondary` → "secondary"
- `brand/accent-color` → "brand-accent-color"
- `ui/background_light` → "ui-background-light"
- `text/heading-primary` → "text-heading-primary"

### CSS Variable References
All color presets reference the original Figma variable as a CSS custom property:

- `primary` → `var(--wp--custom--color--primary)`
- `color/secondary` → `var(--wp--custom--color--secondary)`
- `brand/accent` → `var(--wp--custom--color--brand--accent)`

## Using the Color Customization Modal

The color presets feature includes a sophisticated selection interface:

### Opening the Modal
1. Check "Generate color presets from color variables"
2. Click the "Customize" button (enabled only when the checkbox is checked)
3. The modal will load all available color variables from your Figma document

### Modal Features

#### Collection Organization
- Colors are grouped by their Figma collection
- Each collection has a header with the collection name
- Collection toggle buttons allow selecting/deselecting entire collections

#### Color Preview
Each color item displays:
- **Visual preview**: Shows the actual color value with a color swatch
- **Color name**: Human-readable name derived from the variable name
- **Color slug**: WordPress-compatible slug for the preset
- **Selection checkbox**: Individual selection control

#### Selection Controls
- **Individual selection**: Click on any color item or its checkbox
- **Collection toggles**: "Toggle All" button for each collection
- **Global controls**: "Select All" and "Select None" buttons
- **Selection summary**: Shows "X of Y colors selected"

#### Color Value Resolution
- **Direct colors**: Shows the actual hex/RGB value
- **Variable aliases**: Attempts to resolve referenced variables
- **Fallback display**: Shows a pattern for unresolvable colors

### Selection Workflow

1. **Initial state**: All colors are selected by default when first opened
2. **Browse collections**: Scroll through collections to see available colors
3. **Make selections**: Use individual checkboxes or collection toggles
4. **Review selection**: Check the selection summary at the top
5. **Apply changes**: Click "Apply Selection" to confirm and close the modal

## WordPress Integration

Once exported, these color presets become available in the WordPress block editor:

1. **Block color controls** will show the preset options
2. **Custom colors** can still be used alongside presets
3. **CSS variables** are automatically generated for the color values
4. **Theme consistency** is maintained across all blocks

## Example Output

For Figma variables in a **Color** collection like:
```
primary = #007cba
secondary = #005a87
accent = #ff6900
text/primary = #1e1e1e
text/secondary = #757575
background/light = #ffffff
background/dark = #1e1e1e
```

The plugin generates:
```json
{
  "settings": {
    "color": {
      "palette": [
        {
          "name": "Accent",
          "slug": "accent",
          "color": "var(--wp--custom--color--accent)"
        },
        {
          "name": "Background Dark",
          "slug": "background-dark",
          "color": "var(--wp--custom--color--background--dark)"
        },
        {
          "name": "Background Light",
          "slug": "background-light",
          "color": "var(--wp--custom--color--background--light)"
        },
        {
          "name": "Primary",
          "slug": "primary",
          "color": "var(--wp--custom--color--primary)"
        },
        {
          "name": "Secondary",
          "slug": "secondary",
          "color": "var(--wp--custom--color--secondary)"
        },
        {
          "name": "Text Primary",
          "slug": "text-primary",
          "color": "var(--wp--custom--color--text--primary)"
        },
        {
          "name": "Text Secondary",
          "slug": "text-secondary",
          "color": "var(--wp--custom--color--text--secondary)"
        }
      ]
    }
  }
}
```

## Best Practices

1. **Use semantic naming** for color variables (purpose over appearance)
2. **Organize by hierarchy** using forward slashes for related colors
3. **Create meaningful collections** to group related color systems
4. **Test color combinations** to ensure accessibility and contrast
5. **Use variable aliases** to maintain consistency across color modes

## Troubleshooting

- **Colors not appearing**: Ensure your color variables are published and visible in the Variables panel
- **Missing color previews**: Some variable aliases may not resolve if the referenced variable is not accessible
- **Unexpected names**: Check your variable naming structure and hierarchy
- **Empty color presets**: Verify that you have COLOR type variables in collections other than "Primitives"

For more information on WordPress color presets, see the [WordPress documentation](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#color). 