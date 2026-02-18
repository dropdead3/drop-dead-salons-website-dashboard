/**
 * Utilities for multi-select location filtering.
 *
 * locationId encoding:
 *   - 'all' or ''  → no filter (all locations)
 *   - single UUID  → .eq('location_id', id)
 *   - comma-separated UUIDs → .in('location_id', ids)
 */

export function isAllLocations(locationId: string | undefined): boolean {
  return !locationId || locationId === 'all';
}

export function parseLocationIds(locationId: string | undefined): string[] {
  if (isAllLocations(locationId)) return [];
  return locationId!.split(',').filter(Boolean);
}

export function encodeLocationIds(ids: string[]): string {
  if (ids.length === 0) return 'all';
  return ids.join(',');
}

/**
 * Apply location filter to a Supabase query builder.
 * Handles 'all', single id, and comma-separated multi-select.
 */
export function applyLocationFilter<T extends { eq: (col: string, val: string) => T; in: (col: string, vals: string[]) => T }>(
  query: T,
  locationId: string | undefined,
  column = 'location_id',
): T {
  if (isAllLocations(locationId)) return query;
  const ids = parseLocationIds(locationId);
  if (ids.length === 1) return query.eq(column, ids[0]);
  return query.in(column, ids);
}
