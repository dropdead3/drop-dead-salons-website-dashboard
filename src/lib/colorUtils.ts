/**
 * Utility functions for color conversion and manipulation
 */

/**
 * Converts an HSL string in the format "h s% l%" to a hex color string
 * @param hslString - HSL string like "40 30% 96%" or "hsl(40 30% 96%)"
 * @returns Hex color string like "#F5F0E8"
 */
export function hslToHex(hslString: string): string {
  // Clean up the string - remove "hsl(" and ")" if present
  const cleaned = hslString.replace(/hsl\(|\)/gi, '').trim();
  
  // Parse "40 30% 96%" or "40, 30%, 96%" format
  const parts = cleaned.split(/[\s,]+/).map(v => parseFloat(v.replace('%', '')));
  
  if (parts.length < 3 || parts.some(isNaN)) {
    // Return a fallback if parsing fails
    console.warn(`Failed to parse HSL string: "${hslString}"`);
    return '#888888';
  }
  
  const [h, s, l] = parts;
  
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Checks if a color is considered "dark" based on relative luminance
 * @param hexColor - Hex color string like "#F5F0E8"
 * @returns true if the color is dark
 */
export function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calculate relative luminance using sRGB formula
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  
  return luminance < 0.5;
}
