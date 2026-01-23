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
