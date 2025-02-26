# Typography and Text Styling Guide

This guide provides detailed information on how to use the typography and text styling features of the WordPress Theme.json Exporter plugin.

## Text Style to Typography Preset Conversion

The plugin converts Figma text styles into WordPress typography presets for use in your theme.json file. Here's what you need to know:

### Setting Up Text Styles in Figma

1. **Create local text styles** in your Figma document
2. **Use descriptive naming** for your text styles:
   - For headings, using "H1", "H2", etc. in the name will automatically add the appropriate HTML selector
   - Use hierarchy with slashes (e.g., "Heading/H1", "Body/Regular")
3. **Bind text properties to variables** when possible for better consistency

### Supported Text Properties

The plugin extracts and converts the following text properties:

| Figma Property | WordPress Property | Notes |
|----------------|-------------------|-------|
| Font Family | fontFamily | Converted to CSS var reference if bound to a variable |
| Font Size | fontSize | Adds "px" unit if missing |
| Font Weight | fontWeight | Uses numeric values (100-900) |
| Line Height | lineHeight | Percentage (120%) converted to decimal (1.2) |
| Letter Spacing | letterSpacing | Converted to em units relative to font size |
| Text Case | textTransform | UPPER → uppercase, LOWER → lowercase, etc. |
| Text Decoration | textDecoration | UNDERLINE → underline, STRIKETHROUGH → line-through |
| Text Decoration Color | textDecorationColor | Converted to hex or rgba |
| Text Decoration Style | textDecorationStyle | DASHED → dashed, DOTTED → dotted, etc. |
| Text Decoration Thickness | textDecorationThickness | Adds "px" unit if necessary |
| Text Decoration Offset | textUnderlineOffset | Adds "px" unit if necessary |
| Text Decoration Skip Ink | textDecorationSkipInk | NONE → none, ALL → all |
| Hanging Punctuation | hangingPunctuation | true → "first", false → "none" |
| Leading Trim | leadingTrim | BOTH → both, CAP → start, etc. |

### Line Height Conversion

Line height values are converted from percentage format to decimal format as required by WordPress:

- **Figma value: 120%** → **WordPress value: 1.2**
- **Figma value: 150%** → **WordPress value: 1.5**
- **Figma value: 180%** → **WordPress value: 1.8**

This conversion applies to both:
- Line height defined as a percentage object (`{unit: "PERCENT", value: 120}`)
- Line height defined as a string ending with "%" (`"120%"`)

### Text Decoration Properties

The plugin properly handles text decoration properties:

1. **Text Decoration Color**:
   - If bound to a variable, it uses the CSS variable reference
   - If a direct color value, it converts to a valid hex or rgba value
   - Invalid color values are omitted rather than using fallbacks

2. **Text Decoration Thickness & Underline Offset**:
   - Values are validated and converted to proper formats with "px" units
   - Only included when valid values are available

## Output Format

The typography presets are added to the theme.json under:
```json
{
  "settings": {
    "custom": {
      "typography": {
        "presets": [
          {
            "slug": "heading-1",
            "name": "Heading 1",
            "fontFamily": "var(--wp--custom--font--family--heading)",
            "fontSize": "32px",
            "fontWeight": 700,
            "lineHeight": 1.2,
            "letterSpacing": "0.01em",
            "textTransform": "uppercase",
            "textDecoration": "underline",
            "textDecorationColor": "#000000",
            "textDecorationStyle": "solid",
            "textDecorationThickness": "2px",
            "textUnderlineOffset": "0.2em"
          },
          // Additional presets...
        ]
      }
    }
  }
}
```

## Naming and Slugs

The plugin automatically:

- Creates slugs from style names (converted to lowercase, with hyphens)
- Formats display names to be more readable (capitalized words)
- Adds HTML selectors for heading styles (e.g., `h1` for "H1" styles)

## Best Practices

1. **Use variable binding** for text properties when possible for consistency
2. **Name text styles descriptively** for proper slug and name generation
3. **Group related styles** using hierarchy in names (e.g., "Body/Small", "Body/Regular", "Body/Large")
4. **Set proper line height values** - they will be converted to the format WordPress expects

## Troubleshooting

- **Missing properties**: If a property is invalid or cannot be processed, it will be omitted rather than using defaults
- **Unexpected values**: Check that your Figma text styles have the expected values (font size, weight, etc.)
- **Missing text styles**: Ensure text styles are local to the document and not from a library

For more information on WordPress typography and text styling, see the [WordPress documentation](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#typography). 