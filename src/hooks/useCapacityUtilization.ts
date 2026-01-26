import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, differenceInMinutes, parseISO } from 'date-fns';
import { useActiveLocations, type HoursJson } from '@/hooks/useLocations';
import { getServiceCategory } from '@/utils/serviceCategorization';

export type CapacityPeriod = 'tomorrow' | '7days' | '30days';

export interface ServiceMixItem {
  category: string;
  hours: number;
  revenue: number;
  appointmentCount: number;
  percentage: number;
}

export interface DayCapacity {
  date: string;
  dayName: string;
  availableHours: number;
  bookedHours: number;
  utilizationPercent: number;
  revenue: number;
  appointmentCount: number;
  gapHours: number;
  serviceMix: ServiceMixItem[];
}

export interface CapacityData {
  days: DayCapacity[];
  totalAvailableHours: number;
  totalBookedHours: number;
  totalGapHours: number;
  overallUtilization: number;
  totalRevenue: number;
  totalAppointments: number;
  avgHourlyRevenue: number;
  gapRevenue: number;
  serviceMix: ServiceMixItem[];
  peakDay: DayCapacity | null;
  lowDay: DayCapacity | null;
}

const PERIOD_DAYS: Record<CapacityPeriod, number> = {
  'tomorrow': 1,
  '7days': 7,
  '30days': 30,
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * Calculate operating hours from hours_json for a specific day
 */
function getOperatingHours(hoursJson: HoursJson | null, dayOfWeek: number): number {
  if (!hoursJson) return 8; // Default to 8 hours if no hours set
  
  const dayName = DAY_NAMES[dayOfWeek];
  const dayHours = hoursJson[dayName];
  
  if (!dayHours || dayHours.closed) return 0;
  if (!dayHours.open || !dayHours.close) return 0;
  
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  return (closeMinutes - openMinutes) / 60;
}

/**
 * Calculate appointment duration in hours
 */
function getAppointmentDuration(startTime: string, endTime: string): number {
  try {
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    return differenceInMinutes(end, start) / 60;
  } catch {
    return 1; // Default to 1 hour if parsing fails
  }
}

export function useCapacityUtilization(period: CapacityPeriod, locationId?: string) {
  const { data: locations = [] } = useActiveLocations();
  const today = new Date();
  const dayCount = PERIOD_DAYS[period];
  
  // Generate date range starting from tomorrow
  const dates = Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(today, i + 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayOfWeek: date.getDay(),
      fullDate: date,
    };
  });

  const startDate = dates[0].date;
  const endDate = dates[dates.length - 1].date;

  return useQuery({
    queryKey: ['capacity-utilization', period, startDate, endDate, locationId, locations.length],
    queryFn: async () => {
      // Get filtered locations
      const filteredLocations = locationId && locationId !== 'all'
        ? locations.filter(l => l.id === locationId)
        : locations;

      if (filteredLocations.length === 0) {
        return {
          days: [],
          totalAvailableHours: 0,
          totalBookedHours: 0,
          totalGapHours: 0,
          overallUtilization: 0,
          totalRevenue: 0,
          totalAppointments: 0,
          avgHourlyRevenue: 0,
          gapRevenue: 0,
          serviceMix: [],
          peakDay: null,
          lowDay: null,
        } as CapacityData;
      }

      // Fetch appointments
      let query = supabase
        .from('phorest_appointments')
        .select('id, appointment_date, total_price, status, service_name, start_time, end_time')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      const { data: appointments, error } = await query;
      if (error) throw error;

      // Calculate capacity for each date
      const byDate: Record<string, {
        availableHours: number;
        bookedHours: number;
        revenue: number;
        count: number;
        serviceMix: Record<string, { hours: number; revenue: number; count: number }>;
      }> = {};

      // Initialize each date with available hours
      dates.forEach(d => {
        let totalAvailable = 0;
        
        filteredLocations.forEach(loc => {
          const operatingHours = getOperatingHours(loc.hours_json, d.dayOfWeek);
          const capacity = loc.stylist_capacity || 1; // Default to 1 if not set
          totalAvailable += operatingHours * capacity;
        });

        byDate[d.date] = {
          availableHours: totalAvailable,
          bookedHours: 0,
          revenue: 0,
          count: 0,
          serviceMix: {},
        };
      });

      // Process appointments
      (appointments || []).forEach(apt => {
        const dateKey = apt.appointment_date;
        if (!byDate[dateKey]) return;

        const duration = getAppointmentDuration(apt.start_time, apt.end_time);
        const price = Number(apt.total_price) || 0;
        const category = getServiceCategory(apt.service_name);

        byDate[dateKey].bookedHours += duration;
        byDate[dateKey].revenue += price;
        byDate[dateKey].count += 1;

        // Track service mix
        if (!byDate[dateKey].serviceMix[category]) {
          byDate[dateKey].serviceMix[category] = { hours: 0, revenue: 0, count: 0 };
        }
        byDate[dateKey].serviceMix[category].hours += duration;
        byDate[dateKey].serviceMix[category].revenue += price;
        byDate[dateKey].serviceMix[category].count += 1;
      });

      // Build days array
      const days: DayCapacity[] = dates.map(d => {
        const dayData = byDate[d.date];
        const utilizationPercent = dayData.availableHours > 0
          ? Math.round((dayData.bookedHours / dayData.availableHours) * 100)
          : 0;

        // Convert service mix to array with percentages
        const totalHours = dayData.bookedHours || 1;
        const serviceMix: ServiceMixItem[] = Object.entries(dayData.serviceMix)
          .map(([category, data]) => ({
            category,
            hours: Math.round(data.hours * 10) / 10,
            revenue: data.revenue,
            appointmentCount: data.count,
            percentage: Math.round((data.hours / totalHours) * 100),
          }))
          .sort((a, b) => b.hours - a.hours);

        return {
          date: d.date,
          dayName: d.dayName,
          availableHours: Math.round(dayData.availableHours * 10) / 10,
          bookedHours: Math.round(dayData.bookedHours * 10) / 10,
          utilizationPercent,
          revenue: dayData.revenue,
          appointmentCount: dayData.count,
          gapHours: Math.round((dayData.availableHours - dayData.bookedHours) * 10) / 10,
          serviceMix,
        };
      });

      // Calculate totals
      const totalAvailableHours = days.reduce((sum, d) => sum + d.availableHours, 0);
      const totalBookedHours = days.reduce((sum, d) => sum + d.bookedHours, 0);
      const totalGapHours = totalAvailableHours - totalBookedHours;
      const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0);
      const totalAppointments = days.reduce((sum, d) => sum + d.appointmentCount, 0);
      
      const overallUtilization = totalAvailableHours > 0
        ? Math.round((totalBookedHours / totalAvailableHours) * 100)
        : 0;

      const avgHourlyRevenue = totalBookedHours > 0 
        ? Math.round(totalRevenue / totalBookedHours)
        : 0;

      const gapRevenue = Math.round(totalGapHours * avgHourlyRevenue);

      // Aggregate service mix across all days
      const aggregatedMix: Record<string, { hours: number; revenue: number; count: number }> = {};
      days.forEach(day => {
        day.serviceMix.forEach(item => {
          if (!aggregatedMix[item.category]) {
            aggregatedMix[item.category] = { hours: 0, revenue: 0, count: 0 };
          }
          aggregatedMix[item.category].hours += item.hours;
          aggregatedMix[item.category].revenue += item.revenue;
          aggregatedMix[item.category].count += item.appointmentCount;
        });
      });

      const serviceMix: ServiceMixItem[] = Object.entries(aggregatedMix)
        .map(([category, data]) => ({
          category,
          hours: Math.round(data.hours * 10) / 10,
          revenue: data.revenue,
          appointmentCount: data.count,
          percentage: totalBookedHours > 0 
            ? Math.round((data.hours / totalBookedHours) * 100)
            : 0,
        }))
        .sort((a, b) => b.hours - a.hours);

      // Find peak and low days (excluding days with 0 capacity - closed days)
      const activeDays = days.filter(d => d.availableHours > 0);
      const peakDay = activeDays.reduce<DayCapacity | null>((peak, day) => {
        if (!peak || day.utilizationPercent > peak.utilizationPercent) return day;
        return peak;
      }, null);

      const lowDay = activeDays.reduce<DayCapacity | null>((low, day) => {
        if (!low || day.utilizationPercent < low.utilizationPercent) return day;
        return low;
      }, null);

      return {
        days,
        totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
        totalBookedHours: Math.round(totalBookedHours * 10) / 10,
        totalGapHours: Math.round(totalGapHours * 10) / 10,
        overallUtilization,
        totalRevenue,
        totalAppointments,
        avgHourlyRevenue,
        gapRevenue,
        serviceMix,
        peakDay,
        lowDay,
      } as CapacityData;
    },
    enabled: locations.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
