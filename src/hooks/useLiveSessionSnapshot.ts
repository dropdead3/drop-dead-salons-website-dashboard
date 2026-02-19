import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActiveStylist {
  name: string;
  photoUrl: string | null;
}

export interface StylistDetail {
  name: string;
  photoUrl: string | null;
  currentService: string | null;
  currentEndTime: string | null;
  lastEndTime: string; // wrap-up estimate
}

interface LiveSessionSnapshot {
  inSessionCount: number;
  activeStylistCount: number;
  stylists: ActiveStylist[];
  stylistDetails: StylistDetail[];
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
        .select('id, phorest_staff_id, start_time, end_time, service_name')
        .eq('appointment_date', today)
        .lte('start_time', now)
        .gt('end_time', now);

      if (error) throw error;
      if (!appointments || appointments.length === 0) {
        return { inSessionCount: 0, activeStylistCount: 0, stylists: [], stylistDetails: [] };
      }

      const inSessionCount = appointments.length;

      // Deduplicate staff IDs
      const uniqueStaffIds = [...new Set(
        appointments
          .map(a => a.phorest_staff_id)
          .filter(Boolean) as string[]
      )];

      if (uniqueStaffIds.length === 0) {
        return { inSessionCount, activeStylistCount: 0, stylists: [], stylistDetails: [] };
      }

      // Resolve staff to user profiles via phorest_staff_mapping
      const { data: staffMappings, error: mappingError } = await supabase
        .from('phorest_staff_mapping')
        .select('phorest_staff_id, user_id')
        .in('phorest_staff_id', uniqueStaffIds);

      if (mappingError) throw mappingError;

      const staffToUser = new Map<string, string>();
      (staffMappings || []).forEach(m => {
        if (m.user_id) staffToUser.set(m.phorest_staff_id, m.user_id);
      });

      const userIds = [...new Set(staffToUser.values())];

      if (userIds.length === 0) {
        return { inSessionCount, activeStylistCount: uniqueStaffIds.length, stylists: [], stylistDetails: [] };
      }

      // Get employee profiles for avatars
      const { data: profiles, error: profileError } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      const stylists: ActiveStylist[] = (profiles || []).map(p => ({
        name: p.display_name || p.full_name || '',
        photoUrl: p.photo_url,
      }));

      // Get ALL of today's appointments for active staff to find wrap-up times
      const { data: allTodayAppts, error: allError } = await supabase
        .from('phorest_appointments')
        .select('phorest_staff_id, start_time, end_time, service_name')
        .eq('appointment_date', today)
        .in('phorest_staff_id', uniqueStaffIds);

      if (allError) throw allError;

      // Build per-stylist details
      const stylistDetailsMap = new Map<string, StylistDetail>();

      for (const staffId of uniqueStaffIds) {
        const userId = staffToUser.get(staffId);
        const profile = userId ? profileMap.get(userId) : null;
        const name = profile?.display_name || profile?.full_name || 'Unknown';
        const photoUrl = profile?.photo_url || null;

        // Current in-session appointment (pick latest start)
        const currentAppts = appointments
          .filter(a => a.phorest_staff_id === staffId)
          .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
        const current = currentAppts[0];

        // Last appointment of the day for this staff
        const allForStaff = (allTodayAppts || [])
          .filter(a => a.phorest_staff_id === staffId)
          .sort((a, b) => (b.end_time || '').localeCompare(a.end_time || ''));
        const lastEndTime = allForStaff[0]?.end_time || current?.end_time || '';

        stylistDetailsMap.set(staffId, {
          name,
          photoUrl,
          currentService: current?.service_name || null,
          currentEndTime: current?.end_time || null,
          lastEndTime,
        });
      }

      const stylistDetails = [...stylistDetailsMap.values()]
        .sort((a, b) => a.lastEndTime.localeCompare(b.lastEndTime));

      return {
        inSessionCount,
        activeStylistCount: uniqueStaffIds.length,
        stylists,
        stylistDetails,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    inSessionCount: data?.inSessionCount ?? 0,
    activeStylistCount: data?.activeStylistCount ?? 0,
    stylists: data?.stylists ?? [],
    stylistDetails: data?.stylistDetails ?? [],
    isLoading,
  };
}
