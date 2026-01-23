import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffServiceQualification {
  phorest_staff_id: string;
  phorest_service_id: string;
  phorest_branch_id: string;
  is_qualified: boolean;
}

/**
 * Fetch all qualified staff IDs for a given set of services
 * Returns staff who are qualified for ALL the selected services
 */
export function useQualifiedStaffForServices(serviceIds: string[], branchId?: string) {
  return useQuery({
    queryKey: ['staff-service-qualifications', serviceIds, branchId],
    queryFn: async () => {
      if (serviceIds.length === 0) {
        return { qualifiedStaffIds: [], hasQualificationData: false };
      }

      let query = supabase
        .from('phorest_staff_services')
        .select('phorest_staff_id, phorest_service_id')
        .in('phorest_service_id', serviceIds)
        .eq('is_qualified', true);

      if (branchId) {
        query = query.eq('phorest_branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching staff qualifications:', error);
        return { qualifiedStaffIds: [], hasQualificationData: false };
      }

      if (!data || data.length === 0) {
        // No qualification data means we haven't synced yet - allow all staff
        return { qualifiedStaffIds: [], hasQualificationData: false };
      }

      // Group by staff ID and count how many of the selected services they're qualified for
      const staffServiceCount: Record<string, number> = {};
      for (const qual of data) {
        staffServiceCount[qual.phorest_staff_id] = (staffServiceCount[qual.phorest_staff_id] || 0) + 1;
      }

      // Only include staff qualified for ALL selected services
      const qualifiedStaffIds = Object.entries(staffServiceCount)
        .filter(([_, count]) => count >= serviceIds.length)
        .map(([staffId]) => staffId);

      return { 
        qualifiedStaffIds, 
        hasQualificationData: true,
        partiallyQualified: Object.entries(staffServiceCount)
          .filter(([_, count]) => count < serviceIds.length)
          .map(([staffId, count]) => ({ staffId, qualifiedCount: count, totalRequired: serviceIds.length }))
      };
    },
    enabled: serviceIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all services a specific staff member is qualified for
 */
export function useStaffQualifiedServices(phorestStaffId: string | undefined, branchId?: string) {
  return useQuery({
    queryKey: ['staff-qualified-services', phorestStaffId, branchId],
    queryFn: async () => {
      if (!phorestStaffId) return [];

      let query = supabase
        .from('phorest_staff_services')
        .select('phorest_service_id')
        .eq('phorest_staff_id', phorestStaffId)
        .eq('is_qualified', true);

      if (branchId) {
        query = query.eq('phorest_branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching staff qualified services:', error);
        return [];
      }

      return data?.map(d => d.phorest_service_id) || [];
    },
    enabled: !!phorestStaffId,
    staleTime: 5 * 60 * 1000,
  });
}
