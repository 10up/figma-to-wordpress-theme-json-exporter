# Fluid Variables Guide *(10up tooling feature)*

> **Note:** The way Fluid/responsive variables (including fluid font sizes and fluid spacing) are implemented here is as a superset of WordPress's native theme.json features. It requires using 10up's specific tooling to leverage this feature. If you are not using 10up's tooling, you can still use the plugin, but the exported fluid variables will not be recognized by WordPress and therefore get ignored.

This guide explains how to use the fluid responsive variables feature in the WordPress Theme.json Exporter plugin.

## What Are Fluid Variables?

Fluid variables in WordPress allow for responsive values that automatically scale between minimum and maximum values based on the viewport width. This eliminates the need for multiple breakpoints for many design elements.

The WordPress Theme.json Exporter plugin automatically converts Figma variables with "Desktop" and "Mobile" modes into fluid variables in the theme.json format.

## Setting Up Fluid Variables in Figma

1. **Create a variable collection** with exactly two modes:
   - Name the first mode "Desktop" (for larger screens)
   - Name the second mode "Mobile" (for smaller screens)

2. **Create variables** within this collection
   - Set appropriate values for both Desktop and Mobile modes
   - Values can be direct numbers, colors, or references to other variables

3. **Publish your variables** to make them available for export

## How Fluid Variables Are Exported

The plugin automatically detects collections with Desktop and Mobile modes and exports them as fluid variables with the following structure:

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

Where:
- `min` is the Mobile value
- `max` is the Desktop value
- `fluid: "true"` indicates this is a fluid variable (using string format for WordPress compatibility)

## Fluid Variable Output Format

As of the latest update, fluid variables are exported with the `fluid` property as a string value (`"true"`) rather than a boolean value (`true`). This change ensures compatibility with WordPress theme.json parsing.

Before:
```json
"spacing": {
  "base": {
    "fluid": true,
    "min": "8px",
    "max": "16px"
  }
}
```

After:
```json
"spacing": {
  "base": {
    "fluid": "true",
    "min": "8px",
    "max": "16px"
  }
}
```

## Variable Reference Handling

The plugin handles different scenarios for fluid variables:

1. **Direct values in both modes**:
   - Exports both values as-is with appropriate units
   - For example, `8px` (Mobile) and `16px` (Desktop)

2. **Variable references in both modes**:
   - Exports both as CSS variable references
   - For example, `var(--wp--custom--spacing--small)` and `var(--wp--custom--spacing--large)`

3. **Mixed references and direct values**:
   - In this case, we prioritize the Desktop value
   - No fluid scaling is applied in this scenario

4. **Same value in both modes**:
   - If the Mobile and Desktop values are identical, the plugin exports a single value instead of a fluid object
   - This optimizes the theme.json file size

## WordPress CSS Output

When WordPress processes these fluid variables, it generates CSS similar to:

```css
--wp--custom--spacing--base: clamp(8px, calc(8px + ((1vw - 3.2px) * 1.1429)), 16px);
```

This CSS `clamp()` function automatically scales the value between:
- 8px at the smallest viewport (typically 320px)
- 16px at the largest viewport (typically 1024px)
- Values in between are calculated proportionally

## Use Cases for Fluid Variables

Fluid variables are particularly useful for:

1. **Spacing values** that should scale with screen size
2. **Typography** (font sizes, line heights)
3. **Layout dimensions** (widths, margins, paddings)
4. **Border radii** and other visual treatments

## Best Practices

1. **Use meaningful differences** between Mobile and Desktop values
2. **Consider user experience** when setting min and max values
3. **Use for properties that benefit from scaling** - not everything needs to be fluid
4. **For text, pair with fluid typography** in WordPress

## Examples

### Spacing Scale

```json
{
  "spacing": {
    "base": {
      "fluid": "true",
      "min": "8px",
      "max": "16px"
    },
    "medium": {
      "fluid": "true",
      "min": "16px",
      "max": "32px"
    },
    "large": {
      "fluid": "true", 
      "min": "24px",
      "max": "48px"
    }
  }
}
```

### Typography

```json
{
  "typography": {
    "fontSize": {
      "small": {
        "fluid": "true",
        "min": "14px",
        "max": "16px"
      },
      "medium": {
        "fluid": "true",
        "min": "16px",
        "max": "20px"
      },
      "large": {
        "fluid": "true",
        "min": "20px",
        "max": "36px"
      }
    }
  }
}
```

## Troubleshooting

- **Variables not exporting as fluid**: Make sure your collection has exactly two modes named "Desktop" and "Mobile"
- **Unexpected values**: Check the values in each mode in Figma
- **Not working in WordPress**: Ensure WordPress version supports fluid variables (WordPress 6.1+)

For more information on WordPress fluid variables, see the [WordPress documentation](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/). 