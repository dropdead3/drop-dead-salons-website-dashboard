/**
 * Service name to category mapping utility
 * Maps Phorest service names to display categories for analytics
 */

// Pattern-based categorization for common service types
const CATEGORY_PATTERNS: { pattern: RegExp; category: string }[] = [
  // Blonding services
  { pattern: /balayage|highlight|foil|lightener|blonde|bleach|ombre|root smudge|baby lights|teasy lights/i, category: 'Blonding' },
  
  // Color services
  { pattern: /color|toner|glaze|gloss|demi|semi|permanent|root touch|grey.?blend|coverage|vivid|fashion color/i, category: 'Color' },
  
  // Haircut services
  { pattern: /haircut|cut|trim|bang|fringe|clipper|fade|taper|shape|layers/i, category: 'Haircut' },
  
  // Extensions
  { pattern: /extension|install|removal|move.?up|tape.?in|hand.?tied|weft|keratin bond|fusion/i, category: 'Extensions' },
  
  // Styling services
  { pattern: /blowout|blow.?dry|style|updo|braid|curl|wave|straighten|flat.?iron|event|wedding|bridal|formal/i, category: 'Styling' },
  
  // Treatment/Extras
  { pattern: /treatment|conditioning|deep.?condition|mask|olaplex|k18|repair|keratin treatment|smoothing|scalp/i, category: 'Extras' },
  
  // Consultation
  { pattern: /consult|consultation|assessment|new.?client/i, category: 'New Client Consultation' },
];

/**
 * Get the category for a service name
 * Uses pattern matching to categorize services
 */
export function getServiceCategory(serviceName: string | null): string {
  if (!serviceName) return 'Other';
  
  const normalizedName = serviceName.toLowerCase().trim();
  
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(normalizedName)) {
      return category;
    }
  }
  
  return 'Other';
}

/**
 * Default service categories for display
 */
export const SERVICE_CATEGORIES = [
  'Blonding',
  'Color',
  'Haircut',
  'Extensions',
  'Styling',
  'Extras',
  'New Client Consultation',
  'Other',
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

/**
 * Category colors for charts (matches the service category theme)
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'Blonding': 'hsl(var(--chart-1))',
  'Color': 'hsl(var(--chart-2))',
  'Haircut': 'hsl(var(--chart-3))',
  'Extensions': 'hsl(var(--chart-4))',
  'Styling': 'hsl(var(--chart-5))',
  'Extras': 'hsl(var(--primary))',
  'New Client Consultation': 'hsl(var(--accent))',
  'Other': 'hsl(var(--muted-foreground))',
};
