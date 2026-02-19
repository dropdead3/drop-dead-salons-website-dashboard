import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface ConflictingAppointment {
  appointmentId: string;
  startTime: string;
  endTime: string;
  clientName: string;
  serviceName: string;
  role: 'lead' | 'assistant';
}

/**
 * Given an appointment's date, time range, and ID, fetches all overlapping
 * phorest_appointments and builds a Map<userId, ConflictingAppointment[]>
 * covering both lead-stylist and assistant conflicts.
 */
export function useAssistantConflictCheck(
  appointmentDate: string | null,
  startTime: string | null,
  endTime: string | null,
  currentAppointmentId: string | null,
  enabled: boolean = true,
) {
  const { data: rawConflicts } = useQuery({
    queryKey: ['assistant-conflicts', appointmentDate, startTime, endTime, currentAppointmentId],
    queryFn: async () => {
      // Fetch overlapping appointments with their assistants
      const { data, error } = await supabase
        .from('phorest_appointments')
        .select(`
          id,
          start_time,
          end_time,
          client_name,
          service_name,
          stylist_user_id,
          appointment_assistants (assistant_user_id)
        `)
        .eq('appointment_date', appointmentDate!)
        .lt('start_time', endTime!)
        .gt('end_time', startTime!)
        .not('status', 'in', '("cancelled","no_show")')
        .neq('id', currentAppointmentId!);

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!appointmentDate && !!startTime && !!endTime && !!currentAppointmentId,
    staleTime: 30000,
  });

  const conflictMap = useMemo(() => {
    const map = new Map<string, ConflictingAppointment[]>();
    if (!rawConflicts) return map;

    for (const apt of rawConflicts) {
      const base: Omit<ConflictingAppointment, 'role'> = {
        appointmentId: apt.id,
        startTime: apt.start_time,
        endTime: apt.end_time,
        clientName: apt.client_name || 'Unknown',
        serviceName: apt.service_name || 'Service',
      };

      // Lead stylist conflict
      if (apt.stylist_user_id) {
        const existing = map.get(apt.stylist_user_id) || [];
        existing.push({ ...base, role: 'lead' });
        map.set(apt.stylist_user_id, existing);
      }

      // Assistant conflicts
      const assistants = apt.appointment_assistants as { assistant_user_id: string }[] | null;
      if (assistants) {
        for (const aa of assistants) {
          const existing = map.get(aa.assistant_user_id) || [];
          existing.push({ ...base, role: 'assistant' });
          map.set(aa.assistant_user_id, existing);
        }
      }
    }

    return map;
  }, [rawConflicts]);

  return conflictMap;
}
