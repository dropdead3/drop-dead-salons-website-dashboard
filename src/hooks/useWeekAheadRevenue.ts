import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface DayForecast {
  date: string;
  dayName: string;
  revenue: number;
  appointmentCount: number;
}

export interface WeekAheadData {
  days: DayForecast[];
  totalRevenue: number;
  totalAppointments: number;
  averageDaily: number;
  peakDay: DayForecast | null;
}

export function useWeekAheadRevenue() {
  const today = new Date();
  
  // Generate date range for next 7 days (starting tomorrow)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i + 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
    };
  });

  const startDate = dates[0].date;
  const endDate = dates[6].date;

  return useQuery({
    queryKey: ['week-ahead-revenue', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_appointments')
        .select('appointment_date, total_price, status')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .not('status', 'in', '("cancelled","no_show")');

      if (error) throw error;

      const appointments = data || [];
      
      // Group by date
      const byDate: Record<string, { revenue: number; count: number }> = {};
      dates.forEach(d => {
        byDate[d.date] = { revenue: 0, count: 0 };
      });

      appointments.forEach(apt => {
        const dateKey = apt.appointment_date;
        if (byDate[dateKey]) {
          byDate[dateKey].revenue += Number(apt.total_price) || 0;
          byDate[dateKey].count += 1;
        }
      });

      // Build days array
      const days: DayForecast[] = dates.map(d => ({
        date: d.date,
        dayName: d.dayName,
        revenue: byDate[d.date].revenue,
        appointmentCount: byDate[d.date].count,
      }));

      // Calculate totals
      const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0);
      const totalAppointments = days.reduce((sum, d) => sum + d.appointmentCount, 0);
      const averageDaily = totalRevenue / 7;
      
      // Find peak day
      const peakDay = days.reduce<DayForecast | null>((peak, day) => {
        if (!peak || day.revenue > peak.revenue) return day;
        return peak;
      }, null);

      return {
        days,
        totalRevenue,
        totalAppointments,
        averageDaily,
        peakDay,
      } as WeekAheadData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
