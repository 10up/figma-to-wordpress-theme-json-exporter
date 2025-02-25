console.clear();

function createCollection(name) {
  const lowercaseName = name.toLowerCase();
  const collection = figma.variables.createVariableCollection(lowercaseName);
  const modeId = collection.modes[0].modeId;
  return { collection, modeId };
}

function createToken(collection, modeId, type, name, value) {
  const lowercaseName = name.toLowerCase();
  const token = figma.variables.createVariable(lowercaseName, collection, type);
  token.setValueForMode(modeId, value);
  return token;
}

function createVariable(collection, modeId, key, valueKey, tokens) {
  const token = tokens[valueKey];
  return createToken(collection, modeId, token.resolvedType, key.toLowerCase(), {
    type: "VARIABLE_ALIAS",
    id: `${token.id}`,
  });
}

function importJSONFile({ fileName, body }) {
  const json = JSON.parse(body);
  const { collection, modeId } = createCollection(fileName.toLowerCase());
  const aliases = {};
  const tokens = {};
  Object.entries(json).forEach(([key, object]) => {
    traverseToken({
      collection,
      modeId,
      type: json.$type,
      key: key.toLowerCase(),
      object,
      tokens,
      aliases,
    });
  });
  processAliases({ collection, modeId, aliases, tokens });
}

function processAliases({ collection, modeId, aliases, tokens }) {
  aliases = Object.values(aliases);
  let generations = aliases.length;
  while (aliases.length && generations > 0) {
    for (let i = 0; i < aliases.length; i++) {
      const { key, type, valueKey } = aliases[i];
      const token = tokens[valueKey];
      if (token) {
        aliases.splice(i, 1);
        tokens[key] = createVariable(collection, modeId, key, valueKey, tokens);
      }
    }
    generations--;
  }
}

function isAlias(value) {
  return value.toString().trim().charAt(0) === "{";
}

function traverseToken({
  collection,
  modeId,
  type,
  key,
  object,
  tokens,
  aliases,
}) {
  type = type || object.$type;
  // if key is a meta field, move on
  if (key.charAt(0) === "$") {
    return;
  }
  if (object.$value !== undefined) {
    if (isAlias(object.$value)) {
      const valueKey = object.$value
        .trim()
        .replace(/\./g, "/")
        .replace(/[\{\}]/g, "")
        .toLowerCase();
      if (tokens[valueKey]) {
        tokens[key] = createVariable(collection, modeId, key, valueKey, tokens);
      } else {
        aliases[key] = {
          key,
          type,
          valueKey,
        };
      }
    } else if (type === "color") {
      tokens[key] = createToken(
        collection,
        modeId,
        "COLOR",
        key,
        parseColor(object.$value)
      );
    } else if (type === "number") {
      tokens[key] = createToken(
        collection,
        modeId,
        "FLOAT",
        key,
        object.$value
      );
    } else {
      console.log("unsupported type", type, object);
    }
  } else {
    Object.entries(object).forEach(([key2, object2]) => {
      if (key2.charAt(0) !== "$") {
        traverseToken({
          collection,
          modeId,
          type,
          key: `${key}/${key2.toLowerCase()}`,
          object: object2,
          tokens,
          aliases,
        });
      }
    });
  }
}

// Helper function to convert camelCase to kebab-case
function camelToKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to build a WordPress custom property path
function buildWpCustomPropertyPath(nameParts) {
  // Convert each part to lowercase and then kebab case
  const kebabParts = nameParts.map(part => camelToKebabCase(part.toLowerCase()));
  // Join with -- and prefix with --wp--custom--
  return `--wp--custom--${kebabParts.join('--')}`;
}

// Helper function to build a CSS var() reference
function buildCssVarReference(nameParts) {
  return `var(${buildWpCustomPropertyPath(nameParts)})`;
}

async function exportToJSON() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const files = [];
  for (const collection of collections) {
    files.push(...(await processCollection(collection)));
  }
  figma.ui.postMessage({ type: "EXPORT_RESULT", files });
}

async function processCollection({ name, modes, variableIds }) {
  const files = [];
  
  // Check if this collection has exactly two modes named "Desktop" and "Mobile"
  const isFluidCollection = modes.length === 2 && 
    modes.some(mode => mode.name.toLowerCase() === "desktop") && 
    modes.some(mode => mode.name.toLowerCase() === "mobile");
  
  if (isFluidCollection) {
    // Handle fluid responsive collection with a single theme.json
    // Find the Desktop and Mobile mode IDs
    const desktopMode = modes.find(mode => mode.name.toLowerCase() === "desktop");
    const mobileMode = modes.find(mode => mode.name.toLowerCase() === "mobile");
    const desktopModeId = desktopMode.modeId;
    const mobileModeId = mobileMode.modeId;
    
    // Initialize proper theme.json structure with version
    const file = { 
      fileName: `${name.toLowerCase()}.theme.json`, 
      body: {
        version: 3,
        settings: {
          custom: {}
        }
      } 
    };
    
    // Create a temporary object to hold our variable structure
    const variablesData = {};
    
    // Process all variables
    for (const variableId of variableIds) {
      const { name, resolvedType, valuesByMode } =
        await figma.variables.getVariableByIdAsync(variableId);
      
      const desktopValue = valuesByMode[desktopModeId];
      const mobileValue = valuesByMode[mobileModeId];
      
      if (desktopValue !== undefined && mobileValue !== undefined && 
          ["COLOR", "FLOAT"].includes(resolvedType)) {
        
        // Build the nested structure in our temporary object
        let obj = variablesData;
        // Convert the name parts to lowercase
        const nameParts = name.split("/").map(part => part.toLowerCase());
        
        // Navigate to the appropriate nesting level
        for (let i = 0; i < nameParts.length - 1; i++) {
          const part = nameParts[i];
          obj[part] = obj[part] || {};
          obj = obj[part];
        }
        
        // Set the actual value at the leaf node
        const leafName = nameParts[nameParts.length - 1];
        
        if (desktopValue.type === "VARIABLE_ALIAS" && mobileValue.type === "VARIABLE_ALIAS") {
          // Both are references
          const desktopVar = await figma.variables.getVariableByIdAsync(desktopValue.id);
          const mobileVar = await figma.variables.getVariableByIdAsync(mobileValue.id);
          
          // Convert the references to CSS custom property references
          const desktopReferenceParts = desktopVar.name.split("/").map(part => part.toLowerCase());
          const mobileReferenceParts = mobileVar.name.split("/").map(part => part.toLowerCase());
          
          const maxValue = buildCssVarReference(desktopReferenceParts);
          const minValue = buildCssVarReference(mobileReferenceParts);
          
          // If min and max are the same, use the value directly
          if (maxValue === minValue) {
            obj[leafName] = maxValue;
          } else {
            obj[leafName] = {
              fluid: true,
              min: minValue,
              max: maxValue
            };
          }
        } else if (desktopValue.type === "VARIABLE_ALIAS" || mobileValue.type === "VARIABLE_ALIAS") {
          // Only one is a reference, the other is a direct value
          // This is a complex case - for simplicity, we'll use the desktop value
          if (desktopValue.type === "VARIABLE_ALIAS") {
            const desktopVar = await figma.variables.getVariableByIdAsync(desktopValue.id);
            const desktopReferenceParts = desktopVar.name.split("/").map(part => part.toLowerCase());
            obj[leafName] = buildCssVarReference(desktopReferenceParts);
          } else {
            obj[leafName] = resolvedType === "COLOR" ? rgbToHex(desktopValue) : desktopValue;
          }
        } else {
          // Both are direct values
          const maxValue = resolvedType === "COLOR" ? rgbToHex(desktopValue) : desktopValue;
          const minValue = resolvedType === "COLOR" ? rgbToHex(mobileValue) : mobileValue;
          
          // If min and max are the same, use the value directly
          if (JSON.stringify(maxValue) === JSON.stringify(minValue)) {
            obj[leafName] = maxValue;
          } else {
            obj[leafName] = {
              fluid: true,
              min: minValue,
              max: maxValue
            };
          }
        }
      }
    }
    
    // Add all the variables to the settings.custom section
    file.body.settings.custom = variablesData;
    
    files.push(file);
  } else {
    // Handle regular collection with separate theme.json files for each mode
    for (const mode of modes) {
      // Initialize proper theme.json structure with version
      const file = { 
        fileName: `${name.toLowerCase()}.${mode.name.toLowerCase()}.theme.json`, 
        body: {
          version: 3,
          settings: {
            custom: {}
          }
        } 
      };
      
      // Create a temporary object to hold our variable structure
      const variablesData = {};
      
      for (const variableId of variableIds) {
        const { name, resolvedType, valuesByMode } =
          await figma.variables.getVariableByIdAsync(variableId);
        const value = valuesByMode[mode.modeId];
        
        if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
          // Build the nested structure in our temporary object
          let obj = variablesData;
          // Convert the name parts to lowercase
          const nameParts = name.split("/").map(part => part.toLowerCase());
          
          // Navigate to the appropriate nesting level
          for (let i = 0; i < nameParts.length - 1; i++) {
            const part = nameParts[i];
            obj[part] = obj[part] || {};
            obj = obj[part];
          }
          
          // Set the actual value at the leaf node
          const leafName = nameParts[nameParts.length - 1];
          
          if (value.type === "VARIABLE_ALIAS") {
            const currentVar = await figma.variables.getVariableByIdAsync(
              value.id
            );
            // Convert the reference to a CSS custom property reference with lowercase parts
            const referenceParts = currentVar.name.split("/").map(part => part.toLowerCase());
            obj[leafName] = buildCssVarReference(referenceParts);
          } else {
            obj[leafName] = resolvedType === "COLOR" ? rgbToHex(value) : value;
          }
        }
      }
      
      // Add all the variables to the settings.custom section
      file.body.settings.custom = variablesData;
      
      files.push(file);
    }
  }
  
  return files;
}

figma.ui.onmessage = async (e) => {
  console.log("code received message", e);
  if (e.type === "IMPORT") {
    const { fileName, body } = e;
    importJSONFile({ fileName, body });
  } else if (e.type === "EXPORT") {
    await exportToJSON();
  }
};
if (figma.command === "import") {
  figma.showUI(__uiFiles__["import"], {
    width: 500,
    height: 500,
    themeColors: true,
  });
} else if (figma.command === "export") {
  figma.showUI(__uiFiles__["export"], {
    width: 500,
    height: 500,
    themeColors: true,
  });
}

function rgbToHex({ r, g, b, a }) {
  if (a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}

function parseColor(color) {
  color = color.trim();
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
  const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
  const hslaRegex =
    /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const floatRgbRegex =
    /^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*opacity:\s*[\d\.]+)?\s*\}$/;

  if (rgbRegex.test(color)) {
    const [, r, g, b] = color.match(rgbRegex);
    return { r: parseInt(r) / 255, g: parseInt(g) / 255, b: parseInt(b) / 255 };
  } else if (rgbaRegex.test(color)) {
    const [, r, g, b, a] = color.match(rgbaRegex);
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255,
      a: parseFloat(a),
    };
  } else if (hslRegex.test(color)) {
    const [, h, s, l] = color.match(hslRegex);
    return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
  } else if (hslaRegex.test(color)) {
    const [, h, s, l, a] = color.match(hslaRegex);
    return Object.assign(
      hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
      { a: parseFloat(a) }
    );
  } else if (hexRegex.test(color)) {
    const hexValue = color.substring(1);
    const expandedHex =
      hexValue.length === 3
        ? hexValue
            .split("")
            .map((char) => char + char)
            .join("")
        : hexValue;
    return {
      r: parseInt(expandedHex.slice(0, 2), 16) / 255,
      g: parseInt(expandedHex.slice(2, 4), 16) / 255,
      b: parseInt(expandedHex.slice(4, 6), 16) / 255,
    };
  } else if (floatRgbRegex.test(color)) {
    return JSON.parse(color);
  } else {
    throw new Error("Invalid color format");
  }
}

function hslToRgbFloat(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, (h + 1 / 3) % 1);
  const g = hue2rgb(p, q, h % 1);
  const b = hue2rgb(p, q, (h - 1 / 3) % 1);

  return { r, g, b };
}