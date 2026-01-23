import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns';

export interface DailyVolume {
  date: string;
  count: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface HourlyDistribution {
  hour: number;
  count: number;
  dayOfWeek: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface RetentionMetrics {
  totalClients: number;
  returningClients: number;
  newClients: number;
  retentionRate: number;
  atRiskClients: number;
}

export function useOperationalAnalytics(locationId?: string, dateRange: 'week' | 'month' | '3months' = 'month') {
  // Calculate date range
  const today = new Date();
  let startDate: Date;
  
  switch (dateRange) {
    case 'week':
      startDate = startOfWeek(today);
      break;
    case 'month':
      startDate = startOfMonth(today);
      break;
    case '3months':
      startDate = subDays(today, 90);
      break;
  }

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(today, 'yyyy-MM-dd');

  // Fetch appointment volume data
  const volumeQuery = useQuery({
    queryKey: ['operational-analytics-volume', locationId, startDateStr, endDateStr],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select('appointment_date, status')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const volumeByDate = new Map<string, { count: number; completed: number; cancelled: number; noShow: number }>();
      
      (data || []).forEach(apt => {
        const date = apt.appointment_date;
        const existing = volumeByDate.get(date) || { count: 0, completed: 0, cancelled: 0, noShow: 0 };
        existing.count++;
        
        if (apt.status === 'completed') existing.completed++;
        if (apt.status === 'cancelled') existing.cancelled++;
        if (apt.status === 'no_show') existing.noShow++;
        
        volumeByDate.set(date, existing);
      });

      // Convert to array and sort
      const dailyVolume: DailyVolume[] = Array.from(volumeByDate.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return dailyVolume;
    },
  });

  // Fetch hourly distribution for heatmap
  const heatmapQuery = useQuery({
    queryKey: ['operational-analytics-heatmap', locationId, startDateStr, endDateStr],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select('appointment_date, start_time')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by hour and day of week
      const distribution: HourlyDistribution[] = [];
      const hourDayMap = new Map<string, number>();

      (data || []).forEach(apt => {
        const date = parseISO(apt.appointment_date);
        const dayOfWeek = date.getDay();
        const hour = parseInt(apt.start_time.split(':')[0]);
        const key = `${dayOfWeek}-${hour}`;
        
        hourDayMap.set(key, (hourDayMap.get(key) || 0) + 1);
      });

      // Convert to array
      hourDayMap.forEach((count, key) => {
        const [dayOfWeek, hour] = key.split('-').map(Number);
        distribution.push({ hour, dayOfWeek, count });
      });

      return distribution;
    },
  });

  // Fetch status breakdown
  const statusQuery = useQuery({
    queryKey: ['operational-analytics-status', locationId, startDateStr, endDateStr],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select('status')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Count by status
      const statusCounts = new Map<string, number>();
      (data || []).forEach(apt => {
        statusCounts.set(apt.status, (statusCounts.get(apt.status) || 0) + 1);
      });

      const total = data?.length || 0;
      const breakdown: StatusBreakdown[] = Array.from(statusCounts.entries())
        .map(([status, count]) => ({
          status,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return breakdown;
    },
  });

  // Fetch client retention metrics
  const retentionQuery = useQuery({
    queryKey: ['operational-analytics-retention', locationId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_clients')
        .select('id, visit_count, last_visit, created_at');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalClients = data?.length || 0;
      const returningClients = (data || []).filter(c => c.visit_count > 1).length;
      const newClients = (data || []).filter(c => c.visit_count === 1).length;
      
      // At-risk: 2+ visits but no visit in 60+ days
      const atRiskClients = (data || []).filter(c => {
        if (c.visit_count < 2 || !c.last_visit) return false;
        return differenceInDays(new Date(), parseISO(c.last_visit)) >= 60;
      }).length;

      const retentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

      return {
        totalClients,
        returningClients,
        newClients,
        retentionRate,
        atRiskClients,
      } as RetentionMetrics;
    },
  });

  // Calculate summary stats
  const summary = {
    totalAppointments: volumeQuery.data?.reduce((sum, d) => sum + d.count, 0) || 0,
    completedAppointments: volumeQuery.data?.reduce((sum, d) => sum + d.completed, 0) || 0,
    noShowCount: volumeQuery.data?.reduce((sum, d) => sum + d.noShow, 0) || 0,
    cancelledCount: volumeQuery.data?.reduce((sum, d) => sum + d.cancelled, 0) || 0,
  };

  const noShowRate = summary.totalAppointments > 0 
    ? (summary.noShowCount / summary.totalAppointments) * 100 
    : 0;
  const cancellationRate = summary.totalAppointments > 0 
    ? (summary.cancelledCount / summary.totalAppointments) * 100 
    : 0;

  return {
    dailyVolume: volumeQuery.data || [],
    hourlyDistribution: heatmapQuery.data || [],
    statusBreakdown: statusQuery.data || [],
    retention: retentionQuery.data,
    summary: {
      ...summary,
      noShowRate,
      cancellationRate,
    },
    isLoading: volumeQuery.isLoading || heatmapQuery.isLoading || statusQuery.isLoading || retentionQuery.isLoading,
  };
}
