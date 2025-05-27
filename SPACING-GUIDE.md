# Spacing Presets Guide

This guide explains how to use the spacing presets feature in the WordPress Theme.json Exporter plugin.

## What Are Spacing Presets?

Spacing presets in WordPress allow you to define a set of predefined spacing values that can be used throughout your theme. These presets appear in the WordPress block editor's spacing controls, making it easy for content creators to apply consistent spacing values.

The WordPress Theme.json Exporter plugin automatically converts Figma spacing variables into WordPress spacing presets in the theme.json format.

## Setting Up Spacing Variables in Figma

1. **Create variable collections** with spacing-related variables
2. **Use descriptive naming** that includes spacing-related keywords:
   - `spacing/` - General spacing values
   - `gap/` - Gap values for flexbox/grid layouts
   - `margin/` - Margin values
   - `padding/` - Padding values
   - `size/` - Size-related spacing values
3. **Use FLOAT type variables** for numeric spacing values
4. **Organize hierarchically** using forward slashes (e.g., "spacing/small", "spacing/large")

## Supported Variable Types

The plugin processes FLOAT variables that contain spacing-related keywords in their names:

| Keyword | Description | Example |
|---------|-------------|---------|
| spacing | General spacing values | `spacing/base`, `spacing/large` |
| space | Alternative spacing keyword | `space/small` |
| gap | Gap values for layouts | `gap/medium`, `gap/grid` |
| margin | Margin values | `margin/top`, `margin/section` |
| padding | Padding values | `padding/button`, `padding/card` |
| size | Size-related spacing | `size/icon`, `size/avatar` |

## Fluid Spacing Variables

Variables from the **Spacing** collection that follow the pattern `number_number` (e.g., `24_16`, `16_8`) are automatically detected as fluid spacing variables and receive special naming:

- **Pattern**: Two numbers separated by an underscore (MAX_MIN format)
- **Naming**: "Fluid (min → max)" format (automatically reorders for display)
- **Same Values**: When both numbers are identical, uses simple numeric naming
- **Examples**:
  - `24_16` becomes "Fluid (16 → 24)"
  - `16_8` becomes "Fluid (8 → 16)"
  - `20_12` becomes "Fluid (12 → 20)"
  - `16_16` becomes "16" (not fluid since both values are the same)

This naming convention makes it clear that these are responsive spacing values that scale between the two specified values.

## How Spacing Presets Are Exported

The plugin automatically detects FLOAT variables with spacing-related names and exports them as spacing presets with the following structure:

```json
{
  "settings": {
    "spacing": {
      "spacingSizes": [
        {
          "name": "Small",
          "slug": "small",
          "size": "var(--wp--custom--spacing--small)"
        },
        {
          "name": "Medium",
          "slug": "medium", 
          "size": "var(--wp--custom--spacing--medium)"
        },
        {
          "name": "Large",
          "slug": "large",
          "size": "var(--wp--custom--spacing--large)"
        }
      ]
    }
  }
}
```

## Variable Name Processing

The plugin processes variable names to create user-friendly labels and slugs:

### Name to Label Conversion
- `spacing/small` → "Small"
- `gap/medium-large` → "Medium Large"
- `padding/buttonPrimary` → "Button Primary"
- `margin/card_header` → "Card Header"
- `24_16` → "Fluid (16 → 24)" (special fluid spacing format)
- `16_8` → "Fluid (8 → 16)" (special fluid spacing format)
- `16_16` → "16" (same values, simple numeric format)

### Name to Slug Conversion
- `spacing/small` → "small"
- `gap/medium-large` → "medium-large"
- `padding/buttonPrimary` → "buttonprimary"
- `margin/card_header` → "card-header"
- `24_16` → "24-16" (fluid spacing variables)
- `16_8` → "16-8" (fluid spacing variables)
- `16_16` → "16-16" (same-value spacing variables)

### CSS Variable References
All spacing presets reference the original Figma variable as a CSS custom property:

**From Spacing collection:**
- `spacing/base` → `var(--wp--custom--spacing--base)`
- `base` → `var(--wp--custom--spacing--base)`
- `large` → `var(--wp--custom--spacing--large)`
- `24_16` → `var(--wp--custom--spacing--24-16)` (fluid spacing)
- `16_16` → `var(--wp--custom--spacing--16-16)` (same-value spacing)

**From Primitives collection:**
- `spacing/primitive` → `var(--wp--custom--spacing--primitive)`
- `gap/grid-large` → `var(--wp--custom--gap--grid-large)`
- `padding/card_content` → `var(--wp--custom--padding--card-content)`

## Collection Processing

The plugin only processes spacing variables from specific collections:

- ✅ **Spacing** collection - All FLOAT variables are included
- ✅ **Primitives** collection - Only spacing-related FLOAT variables are included (those with keywords: spacing, space, gap, margin, padding, size)
- ❌ **All other collections** are excluded (Layout, Design System, Color, etc.)

## WordPress Integration

Once exported, these spacing presets become available in the WordPress block editor:

1. **Block spacing controls** will show the preset options
2. **Custom spacing** can still be used alongside presets
3. **CSS variables** are automatically generated for the spacing values
4. **Theme consistency** is maintained across all blocks

## Example Output

For Figma variables in a **Spacing** collection like:
```
xs = 4px
sm = 8px
md = 16px
lg = 24px
xl = 32px
```

And variables in a **Primitives** collection like:
```
spacing/base = 16px
gap/grid = 20px
padding/button = 12px
margin/section = 48px
color/primary = #ff0000  (excluded - not spacing-related)
```

The plugin generates:
```json
{
  "settings": {
    "spacing": {
      "spacingSizes": [
        {
          "name": "Base",
          "slug": "base",
          "size": "var(--wp--custom--spacing--base)"
        },
        {
          "name": "Button",
          "slug": "button",
          "size": "var(--wp--custom--padding--button)"
        },
        {
          "name": "Grid",
          "slug": "grid",
          "size": "var(--wp--custom--gap--grid)"
        },
        {
          "name": "Lg",
          "slug": "lg",
          "size": "var(--wp--custom--lg)"
        },
        {
          "name": "Md",
          "slug": "md",
          "size": "var(--wp--custom--md)"
        },
        {
          "name": "Section",
          "slug": "section",
          "size": "var(--wp--custom--margin--section)"
        },
        {
          "name": "Sm",
          "slug": "sm",
          "size": "var(--wp--custom--sm)"
        },
        {
          "name": "Xl",
          "slug": "xl",
          "size": "var(--wp--custom--xl)"
        },
        {
          "name": "Xs",
          "slug": "xs",
          "size": "var(--wp--custom--xs)"
        }
      ]
    }
  }
}
```

## Best Practices

1. **Use consistent naming** for spacing variables
2. **Include spacing keywords** in variable names for automatic detection
3. **Organize by purpose** (e.g., `spacing/`, `gap/`, `padding/`)
4. **Use meaningful scale** (e.g., xs, sm, md, lg, xl or small, medium, large)
5. **Consider responsive values** by using fluid variables when appropriate
6. **Test in WordPress** to ensure presets work as expected

## Troubleshooting

- **Variables not appearing**: Ensure variable names contain spacing-related keywords
- **Wrong CSS references**: Check that variable names follow the expected format
- **Missing presets**: Verify that variables are FLOAT type and have defined values
- **Unexpected names**: Review variable naming conventions and hierarchy

## Combining with Other Features

Spacing presets work well with other plugin features:

- **Fluid variables**: Use Desktop/Mobile modes for responsive spacing
- **Color presets**: Combine with color variables for complete design system
- **Typography presets**: Create cohesive spacing that complements typography scales
- **Custom variables**: Reference spacing variables in other parts of your theme.json

For more information on WordPress spacing presets, see the [WordPress documentation](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#spacing). 