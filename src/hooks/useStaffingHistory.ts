import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface StaffingHistoryRecord {
  id: string;
  location_id: string;
  record_date: string;
  stylist_count: number;
  assistant_count: number;
  stylist_capacity: number | null;
  assistant_ratio: number | null;
  created_at: string;
}

export interface AggregatedStaffingHistory {
  record_date: string;
  stylist_count: number;
  assistant_count: number;
  total_staff: number;
  stylist_capacity: number;
  total_capacity: number;
}

export function useStaffingHistory(locationId?: string, days = 90) {
  return useQuery({
    queryKey: ['staffing-history', locationId, days],
    queryFn: async (): Promise<StaffingHistoryRecord[]> => {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      let query = supabase
        .from('staffing_history')
        .select('*')
        .gte('record_date', startDate)
        .order('record_date', { ascending: true });
      
      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAggregatedStaffingHistory(days = 90) {
  return useQuery({
    queryKey: ['aggregated-staffing-history', days],
    queryFn: async (): Promise<AggregatedStaffingHistory[]> => {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('staffing_history')
        .select('*')
        .gte('record_date', startDate)
        .order('record_date', { ascending: true });
      
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Aggregate by date across all locations
      const aggregated = data.reduce((acc, record) => {
        const dateKey = record.record_date;
        if (!acc[dateKey]) {
          acc[dateKey] = {
            record_date: dateKey,
            stylist_count: 0,
            assistant_count: 0,
            total_staff: 0,
            stylist_capacity: 0,
            total_capacity: 0,
          };
        }
        acc[dateKey].stylist_count += record.stylist_count || 0;
        acc[dateKey].assistant_count += record.assistant_count || 0;
        acc[dateKey].total_staff += (record.stylist_count || 0) + (record.assistant_count || 0);
        acc[dateKey].stylist_capacity += record.stylist_capacity || 0;
        
        // Calculate assistant capacity from ratio
        const stylistsForCalc = record.stylist_capacity || record.stylist_count || 0;
        const assistantTarget = Math.ceil(stylistsForCalc * (record.assistant_ratio || 0.5));
        acc[dateKey].total_capacity += (record.stylist_capacity || 0) + assistantTarget;
        
        return acc;
      }, {} as Record<string, AggregatedStaffingHistory>);

      return Object.values(aggregated).sort((a, b) => 
        a.record_date.localeCompare(b.record_date)
      );
    },
  });
}
