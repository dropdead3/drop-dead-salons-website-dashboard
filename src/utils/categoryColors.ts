// Special gradient styles collection - shared across the app
export const SPECIAL_GRADIENTS: Record<string, {
  id: string;
  name: string;
  background: string;
  textColor: string;
  glassStroke: string;
}> = {
  'teal-lime': {
    id: 'teal-lime',
    name: 'Teal Lime',
    background: 'linear-gradient(135deg, #43c6ac 0%, #f8ffae 100%)',
    textColor: '#1a3a32',
    glassStroke: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(67,198,172,0.3) 100%)',
  },
  'rose-gold': {
    id: 'rose-gold',
    name: 'Rose Gold',
    background: 'linear-gradient(135deg, #f5af89 0%, #f093a7 50%, #d4a5a5 100%)',
    textColor: '#4a2c2a',
    glassStroke: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(240,147,167,0.3) 100%)',
  },
  'ocean-blue': {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    background: 'linear-gradient(135deg, #667eea 0%, #64b5f6 50%, #4dd0e1 100%)',
    textColor: '#1a2a4a',
    glassStroke: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(100,181,246,0.3) 100%)',
  },
  'lavender': {
    id: 'lavender',
    name: 'Lavender Dream',
    background: 'linear-gradient(135deg, #e0c3fc 0%, #c084fc 50%, #a78bfa 100%)',
    textColor: '#3d2a5c',
    glassStroke: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(192,132,252,0.3) 100%)',
  },
};

// Check if a color_hex value is a gradient marker
export function isGradientMarker(colorHex: string): boolean {
  return colorHex.startsWith('gradient:');
}

// Get gradient style from marker (e.g., "gradient:rose-gold" -> gradient object)
export function getGradientFromMarker(colorHex: string) {
  if (!isGradientMarker(colorHex)) return null;
  const gradientId = colorHex.replace('gradient:', '');
  return SPECIAL_GRADIENTS[gradientId] || null;
}

// Default fallback colors for categories not in the database
const FALLBACK_COLORS: Record<string, { bg: string; text: string; abbr: string }> = {
  blonding: { bg: '#facc15', text: '#1f2937', abbr: 'BL' },
  color: { bg: '#f472b6', text: '#ffffff', abbr: 'CO' },
  haircuts: { bg: '#60a5fa', text: '#ffffff', abbr: 'HC' },
  styling: { bg: '#a78bfa', text: '#ffffff', abbr: 'ST' },
  extensions: { bg: '#10b981', text: '#ffffff', abbr: 'EX' },
  'new client consultation': { bg: '#d4a574', text: '#1f2937', abbr: 'NC' },
  consultation: { bg: '#d4a574', text: '#1f2937', abbr: 'NC' },
  treatment: { bg: '#06b6d4', text: '#ffffff', abbr: 'TR' },
  block: { bg: '#374151', text: '#ffffff', abbr: 'BK' },
  break: { bg: '#4b5563', text: '#ffffff', abbr: 'BR' },
};

// Generic fallback for unknown categories
const DEFAULT_COLOR = { bg: '#6b7280', text: '#ffffff', abbr: '??' };

/**
 * Get the 2-letter abbreviation for a category name
 */
export function getCategoryAbbreviation(categoryName: string): string {
  const words = categoryName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return categoryName.slice(0, 2).toUpperCase();
}

/**
 * Get category colors from a color map, with fallback to defaults
 */
export function getCategoryColor(
  categoryName: string | null | undefined,
  colorMap: Record<string, { bg: string; text: string; abbr: string }>
): { bg: string; text: string; abbr: string } {
  if (!categoryName) {
    return DEFAULT_COLOR;
  }
  
  const normalizedName = categoryName.toLowerCase();
  
  // First check database colors
  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }
  
  // Check fallback colors
  if (FALLBACK_COLORS[normalizedName]) {
    return FALLBACK_COLORS[normalizedName];
  }
  
  // Try partial matching for common patterns
  if (normalizedName.includes('consult')) {
    return FALLBACK_COLORS['consultation'];
  }
  if (normalizedName.includes('blond') || normalizedName.includes('highlight') || normalizedName.includes('balayage')) {
    return { ...FALLBACK_COLORS['blonding'], abbr: getCategoryAbbreviation(categoryName) };
  }
  if (normalizedName.includes('color') || normalizedName.includes('colour')) {
    return { ...FALLBACK_COLORS['color'], abbr: getCategoryAbbreviation(categoryName) };
  }
  if (normalizedName.includes('cut')) {
    return { ...FALLBACK_COLORS['haircuts'], abbr: getCategoryAbbreviation(categoryName) };
  }
  if (normalizedName.includes('style') || normalizedName.includes('blow')) {
    return { ...FALLBACK_COLORS['styling'], abbr: getCategoryAbbreviation(categoryName) };
  }
  if (normalizedName.includes('extension')) {
    return { ...FALLBACK_COLORS['extensions'], abbr: getCategoryAbbreviation(categoryName) };
  }
  if (normalizedName.includes('treatment') || normalizedName.includes('keratin') || normalizedName.includes('condition')) {
    return { ...FALLBACK_COLORS['treatment'], abbr: getCategoryAbbreviation(categoryName) };
  }
  
  // Return default with dynamic abbreviation
  return {
    ...DEFAULT_COLOR,
    abbr: getCategoryAbbreviation(categoryName),
  };
}

/**
 * Calculate contrasting text color for a background
 */
export function getContrastingTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}
