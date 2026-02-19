import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActiveStylist {
  name: string;
  photoUrl: string | null;
}

interface LiveSessionSnapshot {
  inSessionCount: number;
  activeStylistCount: number;
  stylists: ActiveStylist[];
  isLoading: boolean;
}

export function useLiveSessionSnapshot(): LiveSessionSnapshot {
  const { data, isLoading } = useQuery({
    queryKey: ['live-session-snapshot'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), 'HH:mm:ss');

      // Get today's appointments where current time falls between start and end
      const { data: appointments, error } = await supabase
        .from('phorest_appointments')
        .select('id, phorest_staff_id')
        .eq('appointment_date', today)
        .lte('start_time', now)
        .gt('end_time', now);

      if (error) throw error;
      if (!appointments || appointments.length === 0) {
        return { inSessionCount: 0, activeStylistCount: 0, stylists: [] };
      }

      const inSessionCount = appointments.length;

      // Deduplicate staff IDs
      const uniqueStaffIds = [...new Set(
        appointments
          .map(a => a.phorest_staff_id)
          .filter(Boolean) as string[]
      )];

      if (uniqueStaffIds.length === 0) {
        return { inSessionCount, activeStylistCount: 0, stylists: [] };
      }

      // Resolve staff to user profiles via phorest_staff_mapping
      const { data: staffMappings, error: mappingError } = await supabase
        .from('phorest_staff_mapping')
        .select('phorest_staff_id, user_id')
        .in('phorest_staff_id', uniqueStaffIds);

      if (mappingError) throw mappingError;

      const userIds = (staffMappings || [])
        .map(m => m.user_id)
        .filter(Boolean) as string[];

      if (userIds.length === 0) {
        return { inSessionCount, activeStylistCount: uniqueStaffIds.length, stylists: [] };
      }

      // Get employee profiles for avatars
      const { data: profiles, error: profileError } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      const stylists: ActiveStylist[] = (profiles || []).map(p => ({
        name: p.display_name || p.full_name || '',
        photoUrl: p.photo_url,
      }));

      return {
        inSessionCount,
        activeStylistCount: uniqueStaffIds.length,
        stylists,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    inSessionCount: data?.inSessionCount ?? 0,
    activeStylistCount: data?.activeStylistCount ?? 0,
    stylists: data?.stylists ?? [],
    isLoading,
  };
}
