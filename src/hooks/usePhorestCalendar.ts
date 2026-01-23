import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveUserId } from './useEffectiveUser';
import { toast } from 'sonner';

export interface PhorestAppointment {
  id: string;
  phorest_id: string;
  stylist_user_id: string | null;
  phorest_staff_id: string | null;
  client_name: string;
  client_phone: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  service_name: string;
  service_category: string | null;
  status: AppointmentStatus;
  location_id: string | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  stylist_profile?: {
    display_name: string | null;
    full_name: string;
    photo_url: string | null;
  };
}

export type AppointmentStatus = 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export type ColorBy = 'status' | 'service' | 'stylist';

export interface CalendarFilters {
  locationIds: string[];
  stylistIds: string[];
  statuses: AppointmentStatus[];
  showCancelled: boolean;
}

export const STATUS_CONFIG: Record<AppointmentStatus, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  booked: { 
    color: 'text-slate-900', 
    bgColor: 'bg-slate-200', 
    borderColor: 'border-slate-400',
    label: 'Booked' 
  },
  confirmed: { 
    color: 'text-green-900', 
    bgColor: 'bg-green-200', 
    borderColor: 'border-green-500',
    label: 'Confirmed' 
  },
  checked_in: { 
    color: 'text-blue-900', 
    bgColor: 'bg-blue-200', 
    borderColor: 'border-blue-500',
    label: 'Checked In' 
  },
  completed: { 
    color: 'text-purple-900', 
    bgColor: 'bg-purple-200', 
    borderColor: 'border-purple-500',
    label: 'Completed' 
  },
  cancelled: { 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100', 
    borderColor: 'border-gray-300',
    label: 'Cancelled' 
  },
  no_show: { 
    color: 'text-red-900', 
    bgColor: 'bg-red-200', 
    borderColor: 'border-red-500',
    label: 'No Show' 
  },
};

export function usePhorestCalendar() {
  const { hasPermission } = useAuth();
  const effectiveUserId = useEffectiveUserId();
  const queryClient = useQueryClient();
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [filters, setFilters] = useState<CalendarFilters>({
    locationIds: [],
    stylistIds: [],
    statuses: ['booked', 'confirmed', 'checked_in', 'completed'],
    showCancelled: false,
  });

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case 'day':
        return {
          start: format(currentDate, 'yyyy-MM-dd'),
          end: format(currentDate, 'yyyy-MM-dd'),
        };
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return {
          start: format(weekStart, 'yyyy-MM-dd'),
          end: format(weekEnd, 'yyyy-MM-dd'),
        };
      case 'month':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return {
          start: format(monthStart, 'yyyy-MM-dd'),
          end: format(monthEnd, 'yyyy-MM-dd'),
        };
      case 'agenda':
        // Agenda shows 2 weeks
        return {
          start: format(currentDate, 'yyyy-MM-dd'),
          end: format(addDays(currentDate, 14), 'yyyy-MM-dd'),
        };
      default:
        return {
          start: format(currentDate, 'yyyy-MM-dd'),
          end: format(currentDate, 'yyyy-MM-dd'),
        };
    }
  }, [currentDate, view]);

  // Permission checks
  const canViewAll = hasPermission('view_all_locations_calendar');
  const canViewTeam = hasPermission('view_team_appointments');
  const canViewOwn = hasPermission('view_own_appointments');
  const canCreate = hasPermission('create_appointments');

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['phorest-appointments', dateRange, filters, effectiveUserId, canViewAll, canViewTeam],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select(`
          *,
          stylist_profile:employee_profiles!phorest_appointments_stylist_user_id_fkey(
            display_name,
            full_name,
            photo_url
          )
        `)
        .gte('appointment_date', dateRange.start)
        .lte('appointment_date', dateRange.end)
        .order('appointment_date')
        .order('start_time');

      // Apply status filter
      if (filters.showCancelled) {
        query = query.in('status', [...filters.statuses, 'cancelled', 'no_show']);
      } else {
        query = query.in('status', filters.statuses);
      }

      // Apply permission-based filtering
      if (!canViewAll && !canViewTeam && canViewOwn && effectiveUserId) {
        // Only view own appointments
        query = query.eq('stylist_user_id', effectiveUserId);
      }

      // Apply stylist filter if selected
      if (filters.stylistIds.length > 0) {
        query = query.in('stylist_user_id', filters.stylistIds);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PhorestAppointment[];
    },
  });

  // Get last sync time
  const { data: lastSync } = useQuery({
    queryKey: ['phorest-last-sync'],
    queryFn: async () => {
      const { data } = await supabase
        .from('phorest_sync_log')
        .select('completed_at')
        .eq('sync_type', 'appointments')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      return data?.completed_at ? new Date(data.completed_at) : null;
    },
  });

  // Update appointment status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) => {
      const response = await supabase.functions.invoke('update-phorest-appointment', {
        body: { appointment_id: appointmentId, status: status.toUpperCase() },
      });
      
      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Update failed');
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phorest-appointments'] });
      toast.success('Appointment updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update appointment', { description: error.message });
    },
  });

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, PhorestAppointment[]>();
    appointments.forEach(apt => {
      const date = apt.appointment_date;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(apt);
    });
    return map;
  }, [appointments]);

  // Navigation helpers
  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      switch (view) {
        case 'day': return addDays(prev, -1);
        case 'week': return addDays(prev, -7);
        case 'month': return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        case 'agenda': return addDays(prev, -14);
        default: return prev;
      }
    });
  }, [view]);
  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (view) {
        case 'day': return addDays(prev, 1);
        case 'week': return addDays(prev, 7);
        case 'month': return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        case 'agenda': return addDays(prev, 14);
        default: return prev;
      }
    });
  }, [view]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke('sync-phorest-data', {
        body: { 
          sync_type: 'appointments',
          date_from: dateRange.start,
          date_to: dateRange.end,
        },
      });
      
      if (response.error) throw response.error;
      
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['phorest-last-sync'] });
      toast.success('Calendar synced successfully');
    } catch (error: any) {
      toast.error('Sync failed', { description: error.message });
    }
  }, [dateRange, refetch, queryClient]);

  return {
    // State
    currentDate,
    setCurrentDate,
    view,
    setView,
    filters,
    setFilters,
    
    // Data
    appointments,
    appointmentsByDate,
    isLoading,
    lastSync,
    
    // Permissions
    canViewAll,
    canViewTeam,
    canViewOwn,
    canCreate,
    
    // Actions
    goToToday,
    goToPrevious,
    goToNext,
    triggerSync,
    refetch,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
  };
}
