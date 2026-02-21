import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffQualification {
  id: string;
  user_id: string;
  service_id: string;
  is_active: boolean | null;
  location_id: string | null;
  custom_price: number | null;
}

/**
 * Fetch all staff_service_qualifications rows for a given user.
 */
export function useStaffQualifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['staff-service-qualifications-config', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('staff_service_qualifications')
        .select('id, user_id, service_id, is_active, location_id, custom_price')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []) as StaffQualification[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Toggle a single service qualification on/off for a user.
 * Upserts with is_active = newState.
 */
export function useToggleServiceQualification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      serviceId,
      isActive,
    }: {
      userId: string;
      serviceId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from('staff_service_qualifications')
        .upsert(
          { user_id: userId, service_id: serviceId, is_active: isActive },
          { onConflict: 'user_id,service_id,location_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff-service-qualifications-config', vars.userId] });
      qc.invalidateQueries({ queryKey: ['staff-service-qualifications'] });
      qc.invalidateQueries({ queryKey: ['staff-qualified-services'] });
    },
  });
}

/**
 * Bulk toggle all services in a category for a user.
 */
export function useBulkToggleCategoryQualifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      serviceIds,
      isActive,
    }: {
      userId: string;
      serviceIds: string[];
      isActive: boolean;
    }) => {
      const rows = serviceIds.map((serviceId) => ({
        user_id: userId,
        service_id: serviceId,
        is_active: isActive,
      }));
      const { error } = await supabase
        .from('staff_service_qualifications')
        .upsert(rows, { onConflict: 'user_id,service_id,location_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff-service-qualifications-config', vars.userId] });
      qc.invalidateQueries({ queryKey: ['staff-service-qualifications'] });
      qc.invalidateQueries({ queryKey: ['staff-qualified-services'] });
    },
  });
}

/** Service-provider roles that should appear in the stylist selector */
const SERVICE_PROVIDER_ROLES = ['stylist', 'stylist_assistant', 'booth_renter'] as const;

/**
 * Fetch active team members for the stylist selector dropdown.
 * Filters to service-provider roles only and optionally by location.
 */
export function useActiveStylists(organizationId: string | undefined, locationId?: string) {
  return useQuery({
    queryKey: ['active-stylists', organizationId, locationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // 1. Get user_ids that have a service-provider role
      const { data: roleRows, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', SERVICE_PROVIDER_ROLES);
      if (rolesError) throw rolesError;
      const providerUserIds = (roleRows || []).map(r => r.user_id);
      if (providerUserIds.length === 0) return [];

      // 2. Fetch employee profiles filtered to those user_ids
      let query = supabase
        .from('employee_profiles')
        .select('user_id, display_name, full_name, photo_url, location_id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .in('user_id', providerUserIds)
        .order('display_name');

      // 3. Optional location filter
      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}
