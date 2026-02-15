/**
 * Report catalog by organization tier (derived from location count).
 * Operator = 1 location, Growth = 2-5, Infrastructure = 6+.
 * Used to show only relevant reports in the Reports hub.
 */

export type ReportTier = 'operator' | 'growth' | 'infrastructure';

export function getReportTier(locationCount: number): ReportTier {
  if (locationCount >= 6) return 'infrastructure';
  if (locationCount >= 2) return 'growth';
  return 'operator';
}

/** Report IDs that require multiple locations (hidden for Operator) */
const MULTI_LOCATION_REPORT_IDS = new Set([
  'location-sales',
]);

/** Report IDs available only for Growth and above */
const GROWTH_AND_ABOVE_REPORT_IDS = new Set([
  ...MULTI_LOCATION_REPORT_IDS,
]);

/** Report IDs available only for Infrastructure (e.g. Custom Builder, Scheduled could be growth+) */
const INFRASTRUCTURE_REPORT_IDS = new Set<string>([
  // Custom Builder and Scheduled are available to all for now; add here if we gate them
]);

/**
 * Returns true if the report should be shown for the given tier.
 */
export function isReportVisibleForTier(reportId: string, tier: ReportTier): boolean {
  if (INFRASTRUCTURE_REPORT_IDS.has(reportId)) {
    return tier === 'infrastructure';
  }
  if (GROWTH_AND_ABOVE_REPORT_IDS.has(reportId)) {
    return tier === 'growth' || tier === 'infrastructure';
  }
  return true;
}

/**
 * Filter a list of report configs (with id) by tier.
 */
export function filterReportsByTier<T extends { id: string }>(
  reports: T[],
  tier: ReportTier
): T[] {
  return reports.filter((r) => isReportVisibleForTier(r.id, tier));
}
