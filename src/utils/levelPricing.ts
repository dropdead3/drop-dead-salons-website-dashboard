import { services, StylistLevel, stylistLevels } from '@/data/servicePricing';

// Map from database stylist_level values (e.g., "LEVEL 3 STYLIST") to servicePricing slugs
const levelNumberToSlug: Record<number, StylistLevel> = {
  1: 'new-talent',
  2: 'emerging', // Level 2 = Studio Artist, uses 'emerging' pricing in servicePricing.ts
  3: 'emerging', // Level 3 = Core Artist (emerging)
  4: 'lead',
  5: 'senior',
  6: 'signature',
  7: 'icon',
};

/**
 * Parses a stylist level string (e.g., "LEVEL 3 STYLIST") and returns the pricing slug
 */
export function getLevelSlug(stylistLevel: string | null | undefined): StylistLevel | null {
  if (!stylistLevel) return null;
  
  const match = stylistLevel.match(/LEVEL\s*(\d+)/i);
  if (!match) return null;
  
  const levelNum = parseInt(match[1], 10);
  return levelNumberToSlug[levelNum] || null;
}

/**
 * Extracts just the level number from a stylist level string
 */
export function getLevelNumber(stylistLevel: string | null | undefined): number | null {
  if (!stylistLevel) return null;
  
  const match = stylistLevel.match(/LEVEL\s*(\d+)/i);
  if (!match) return null;
  
  return parseInt(match[1], 10);
}

/**
 * Finds the level-based price for a service by name and level slug
 * Returns the numeric price or null if not found
 */
export function findLevelBasedPrice(serviceName: string, levelSlug: StylistLevel): number | null {
  // Normalize service name for matching
  const normalizedName = serviceName.toLowerCase().trim();
  
  for (const category of services) {
    for (const item of category.items) {
      // Check for exact match or close match
      if (item.name.toLowerCase().trim() === normalizedName) {
        const priceStr = item.prices[levelSlug];
        if (priceStr) {
          // Parse price string like "$152" to number
          const price = parseFloat(priceStr.replace(/[$,]/g, ''));
          return isNaN(price) ? null : price;
        }
      }
    }
  }
  
  return null;
}

/**
 * Gets the display label for a level number
 */
export function getLevelLabel(levelNumber: number): string {
  const levelInfo = stylistLevels.find((_, index) => index + 1 === levelNumber);
  return levelInfo?.clientLabel || `Level ${levelNumber}`;
}
