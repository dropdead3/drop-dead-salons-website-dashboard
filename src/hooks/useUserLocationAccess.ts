import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useActiveLocations } from '@/hooks/useLocations';

/**
 * Hook that encapsulates location-based access control logic.
 * Determines which locations a user can view analytics for based on:
 * - Super admin status (full access)
 * - `view_all_locations_analytics` permission (full access)
 * - Assigned location(s) on their profile (restricted access)
 */
export function useUserLocationAccess() {
  const { hasPermission } = useAuth();
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile();
  const { data: allLocations, isLoading: locationsLoading } = useActiveLocations();
  
  // Super admin or has cross-location permission
  const canViewAllLocations = useMemo(() => {
    if (profile?.is_super_admin) return true;
    return hasPermission('view_all_locations_analytics');
  }, [profile?.is_super_admin, hasPermission]);
  
  // Get user's assigned locations from profile
  // Supports both legacy location_id and multi-location location_ids
  const assignedLocationIds = useMemo(() => {
    if (!profile) return [];
    // Prefer location_ids array if populated
    if (profile.location_ids && profile.location_ids.length > 0) {
      return profile.location_ids;
    }
    // Fallback to legacy single location_id
    if (profile.location_id) {
      return [profile.location_id];
    }
    return [];
  }, [profile]);
  
  // Filter locations based on access
  const accessibleLocations = useMemo(() => {
    if (!allLocations) return [];
    if (canViewAllLocations) return allLocations;
    return allLocations.filter(loc => assignedLocationIds.includes(loc.id));
  }, [allLocations, canViewAllLocations, assignedLocationIds]);
  
  // Determine if "All Locations" aggregate view is available
  // Available for super admins, users with permission, or users with no location assignment (edge case)
  const canViewAggregate = useMemo(() => {
    return canViewAllLocations || assignedLocationIds.length === 0;
  }, [canViewAllLocations, assignedLocationIds]);
  
  // Get default location (first assigned or 'all' if permitted)
  const defaultLocationId = useMemo(() => {
    if (canViewAllLocations) return 'all';
    if (assignedLocationIds.length > 0) return assignedLocationIds[0];
    return 'all'; // Fallback for edge case
  }, [canViewAllLocations, assignedLocationIds]);
  
  return {
    /** Whether user can view analytics for all locations */
    canViewAllLocations,
    /** List of locations the user has access to */
    accessibleLocations,
    /** IDs of locations assigned to the user's profile */
    assignedLocationIds,
    /** Whether user can see the "All Locations" aggregate option */
    canViewAggregate,
    /** The default location ID to use (first assigned or 'all') */
    defaultLocationId,
    /** Whether location access data is still loading */
    isLoading: profileLoading || locationsLoading,
  };
}
