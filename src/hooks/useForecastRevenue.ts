import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

export type ForecastPeriod = 'tomorrow' | '7days' | '30days' | '60days';

export interface AppointmentSummary {
  id: string;
  client_name: string | null;
  service_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number | null;
  stylist_name: string | null;
}

export interface DayForecast {
  date: string;
  dayName: string;
  revenue: number;
  confirmedRevenue: number;
  unconfirmedRevenue: number;
  appointmentCount: number;
  appointments: AppointmentSummary[];
}

export interface WeekForecast {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  revenue: number;
  confirmedRevenue: number;
  unconfirmedRevenue: number;
  appointmentCount: number;
  days: DayForecast[];
}

export interface ForecastData {
  days: DayForecast[];
  weeks: WeekForecast[];
  totalRevenue: number;
  totalAppointments: number;
  averageDaily: number;
  averageWeekly: number;
  peakDay: DayForecast | null;
  peakWeek: WeekForecast | null;
}

const PERIOD_DAYS: Record<ForecastPeriod, number> = {
  'tomorrow': 1,
  '7days': 7,
  '30days': 30,
  '60days': 60,
};

export function useForecastRevenue(period: ForecastPeriod, locationId?: string) {
  const today = new Date();
  const dayCount = PERIOD_DAYS[period];
  
  // Generate date range starting from tomorrow
  const dates = Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(today, i + 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      fullDate: date,
    };
  });

  const startDate = dates[0].date;
  const endDate = dates[dates.length - 1].date;

  return useQuery({
    queryKey: ['forecast-revenue', period, startDate, endDate, locationId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select('id, appointment_date, total_price, status, client_name, service_name, start_time, end_time, phorest_staff_id')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .not('status', 'in', '("cancelled","no_show")')
        .order('start_time', { ascending: true });

      // Filter by location if specified
      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const appointments = data || [];

      // Fetch staff names for the appointments
      const staffIds = [...new Set(appointments.map(a => a.phorest_staff_id).filter(Boolean))] as string[];
      const staffMap: Record<string, string> = {};
      
      if (staffIds.length > 0) {
        const { data: staffData } = await (supabase as any)
          .from('phorest_staff_mappings')
          .select('phorest_staff_id, staff_first_name, staff_last_name')
          .in('phorest_staff_id', staffIds);
        
        if (staffData) {
          (staffData as any[]).forEach((s: any) => {
            if (s.phorest_staff_id) {
              staffMap[s.phorest_staff_id] = `${s.staff_first_name || ''} ${s.staff_last_name?.charAt(0) || ''}.`.trim();
            }
          });
        }
      }
      
      // Group by date
      const byDate: Record<string, { revenue: number; confirmedRevenue: number; unconfirmedRevenue: number; count: number; appointments: AppointmentSummary[] }> = {};
      dates.forEach(d => {
        byDate[d.date] = { revenue: 0, confirmedRevenue: 0, unconfirmedRevenue: 0, count: 0, appointments: [] };
      });

      appointments.forEach(apt => {
        const dateKey = apt.appointment_date;
        if (byDate[dateKey]) {
          const price = Number(apt.total_price) || 0;
          const status = apt.status?.toLowerCase() || '';
          const isUnconfirmed = status === 'unconfirmed' || status === 'pending';
          
          byDate[dateKey].revenue += price;
          if (isUnconfirmed) {
            byDate[dateKey].unconfirmedRevenue += price;
          } else {
            byDate[dateKey].confirmedRevenue += price;
          }
          byDate[dateKey].count += 1;
          byDate[dateKey].appointments.push({
            id: apt.id,
            client_name: apt.client_name,
            service_name: apt.service_name,
            start_time: apt.start_time,
            end_time: apt.end_time,
            status: apt.status,
            total_price: apt.total_price,
            stylist_name: apt.phorest_staff_id ? staffMap[apt.phorest_staff_id] || null : null,
          });
        }
      });

      // Build days array
      const days: DayForecast[] = dates.map(d => ({
        date: d.date,
        dayName: d.dayName,
        revenue: byDate[d.date].revenue,
        confirmedRevenue: byDate[d.date].confirmedRevenue,
        unconfirmedRevenue: byDate[d.date].unconfirmedRevenue,
        appointmentCount: byDate[d.date].count,
        appointments: byDate[d.date].appointments,
      }));

      // Group days into weeks for 30/60 day views
      const weeks: WeekForecast[] = [];
      if (dayCount >= 30) {
        const weekMap = new Map<string, DayForecast[]>();
        
        days.forEach(day => {
          const dayDate = new Date(day.date + 'T00:00:00');
          const weekStart = startOfWeek(dayDate, { weekStartsOn: 1 }); // Monday
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          
          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, []);
          }
          weekMap.get(weekKey)!.push(day);
        });

        // Convert to weeks array
        Array.from(weekMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([weekStartStr, weekDays]) => {
            const weekStartDate = new Date(weekStartStr + 'T00:00:00');
            const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
            
            weeks.push({
              weekStart: weekStartStr,
              weekEnd: format(weekEndDate, 'yyyy-MM-dd'),
              weekLabel: `Week of ${format(weekStartDate, 'MMM d')}`,
              revenue: weekDays.reduce((sum, d) => sum + d.revenue, 0),
              confirmedRevenue: weekDays.reduce((sum, d) => sum + d.confirmedRevenue, 0),
              unconfirmedRevenue: weekDays.reduce((sum, d) => sum + d.unconfirmedRevenue, 0),
              appointmentCount: weekDays.reduce((sum, d) => sum + d.appointmentCount, 0),
              days: weekDays,
            });
          });
      }

      // Calculate totals
      const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0);
      const totalAppointments = days.reduce((sum, d) => sum + d.appointmentCount, 0);
      const averageDaily = dayCount > 0 ? totalRevenue / dayCount : 0;
      const averageWeekly = weeks.length > 0 ? totalRevenue / weeks.length : averageDaily * 7;
      
      // Find peak day
      const peakDay = days.reduce<DayForecast | null>((peak, day) => {
        if (!peak || day.revenue > peak.revenue) return day;
        return peak;
      }, null);

      // Find peak week
      const peakWeek = weeks.reduce<WeekForecast | null>((peak, week) => {
        if (!peak || week.revenue > peak.revenue) return week;
        return peak;
      }, null);

      return {
        days,
        weeks,
        totalRevenue,
        totalAppointments,
        averageDaily,
        averageWeekly,
        peakDay,
        peakWeek,
      } as ForecastData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
