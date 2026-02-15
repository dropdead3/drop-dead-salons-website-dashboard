/**
 * Locale-aware number formatting for non-currency values (counts, percentages).
 * Uses Intl.NumberFormat so grouping (e.g. 1,000 vs 1.000) matches org locale.
 */

const DEFAULT_LOCALE = 'en';

/**
 * Format a number for display using the given locale.
 * Use for counts, percentages, and other non-currency numbers.
 */
export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a percentage (value 0–100 or 0–1). Pass whole numbers (e.g. 42 for 42%) or decimals (0.42).
 * Set wholeNumber true if value is already 0–100.
 */
export function formatPercent(
  value: number,
  locale: string = DEFAULT_LOCALE,
  wholeNumber: boolean = true
): string {
  const num = wholeNumber ? value : value * 100;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(num / 100);
}
