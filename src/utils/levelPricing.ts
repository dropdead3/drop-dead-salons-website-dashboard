/**
 * Level pricing utilities.
 * These helpers work with stylist level strings (e.g. "LEVEL 3 STYLIST") used in
 * the scheduling / booking system. Price lookups now go through the database
 * via service_level_prices rather than the legacy static file.
 */

// Canonical slug type — matches stylist_levels.slug values in the DB
export type LevelSlug = string;

// Map from level number to the DB slug (matches stylist_levels.slug column)
const levelNumberToSlug: Record<number, string> = {
  1: 'new-talent',
  2: 'emerging',
  3: 'emerging',
  4: 'lead',
  5: 'senior',
  6: 'signature',
  7: 'icon',
};

/**
 * Parses a stylist level string (e.g., "LEVEL 3 STYLIST") and returns the pricing slug.
 */
export function getLevelSlug(stylistLevel: string | null | undefined): string | null {
  if (!stylistLevel) return null;
  const match = stylistLevel.match(/LEVEL\s*(\d+)/i);
  if (!match) return null;
  const levelNum = parseInt(match[1], 10);
  return levelNumberToSlug[levelNum] || null;
}

/**
 * Extracts just the level number from a stylist level string.
 */
export function getLevelNumber(stylistLevel: string | null | undefined): number | null {
  if (!stylistLevel) return null;
  const match = stylistLevel.match(/LEVEL\s*(\d+)/i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Finds the level-based price for a service using pre-fetched data.
 * @param levelPrices - Map of stylist_level_id → price (from service_level_prices table)
 * @param levels - Array of { id, slug } from stylist_levels table
 * @param levelSlug - The slug to look up (e.g. 'emerging')
 * @returns The numeric price or null if not found
 */
export function findLevelPrice(
  levelPrices: Record<string, number>,
  levels: Array<{ id: string; slug: string }>,
  levelSlug: string,
): number | null {
  const level = levels.find(l => l.slug === levelSlug);
  if (!level) return null;
  const price = levelPrices[level.id];
  return price !== undefined ? price : null;
}

/**
 * @deprecated Use findLevelPrice with pre-fetched data instead.
 * This shim returns null — callers fall back to service.price (base price).
 * Booking components should be migrated to use service_level_prices via hooks.
 */
export function findLevelBasedPrice(_serviceName: string, _levelSlug: string): number | null {
  return null;
}

/**
 * Gets a display label for a level number (e.g. "Level 3").
 */
export function getLevelLabel(levelNumber: number): string {
  return `Level ${levelNumber}`;
}
