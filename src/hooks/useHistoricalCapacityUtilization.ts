import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, startOfMonth, differenceInMinutes, parseISO, addDays } from 'date-fns';
import { getServiceCategory } from '@/utils/serviceCategorization';

export interface DayCapacity {
  date: string;
  dayName: string;
  availableHours: number;
  bookedHours: number;
  utilizationPercent: number;
  appointmentCount: number;
  revenue: number;
  gapHours: number;
}

export interface ServiceMix {
  category: string;
  hours: number;
  revenue: number;
  count: number;
  percentage: number;
}

export interface CapacityData {
  totalAvailableHours: number;
  totalBookedHours: number;
  overallUtilization: number;
  gapHours: number;
  gapRevenue: number;
  avgHourlyRevenue: number;
  dailyCapacity: DayCapacity[];
  serviceMix: ServiceMix[];
  totalAppointments: number;
  peakDay: DayCapacity | null;
  lowDay: DayCapacity | null;
}

// Parse hours from location hours_json for a specific day
function getOperatingHoursForDay(hoursJson: Record<string, any> | null, dayOfWeek: number): number {
  if (!hoursJson) return 8; // Default to 8 hours
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const dayHours = hoursJson[dayName];
  
  if (!dayHours || dayHours.closed) return 0;
  
  try {
    const [openHour, openMin] = (dayHours.open || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (dayHours.close || '18:00').split(':').map(Number);
    return (closeHour + closeMin / 60) - (openHour + openMin / 60);
  } catch {
    return 8; // Default fallback
  }
}

export type CapacityDateRange = 'tomorrow' | '7days' | '30days' | '90days';

export function useHistoricalCapacityUtilization(
  locationId?: string,
  dateRange: CapacityDateRange = '30days'
) {
  const today = new Date();
  let startDate: Date;
  let endDate: Date = today;
  
  switch (dateRange) {
    case 'tomorrow':
      startDate = addDays(today, 1);
      endDate = addDays(today, 1);
      break;
    case '7days':
      startDate = addDays(today, 1);
      endDate = addDays(today, 7);
      break;
    case '30days':
      startDate = addDays(today, 1);
      endDate = addDays(today, 30);
      break;
    case '90days':
      startDate = addDays(today, 1);
      endDate = addDays(today, 90);
      break;
  }

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // Fetch locations data
  const locationsQuery = useQuery({
    queryKey: ['locations-capacity-historical', locationId],
    queryFn: async () => {
      let query = supabase
        .from('locations')
        .select('id, name, stylist_capacity, hours_json')
        .eq('is_active', true);

      if (locationId) {
        query = query.eq('id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch appointments for the historical period
  const appointmentsQuery = useQuery({
    queryKey: ['historical-capacity-appointments', locationId, startDateStr, endDateStr],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select('appointment_date, start_time, end_time, total_price, service_name, location_id, status')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate capacity data
  const capacityData: CapacityData | null = (() => {
    if (!locationsQuery.data || !appointmentsQuery.data) return null;

    const locations = locationsQuery.data;
    const appointments = appointmentsQuery.data;

    if (locations.length === 0) return null;

    // Calculate daily capacity
    const dailyMap = new Map<string, DayCapacity>();
    const serviceMixMap = new Map<string, ServiceMix>();

    // Initialize days in range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay();
      
      // Calculate available hours for this day across all relevant locations
      let dayAvailableHours = 0;
      locations.forEach(loc => {
        const hoursJson = loc.hours_json as Record<string, any> | null;
        const operatingHours = getOperatingHoursForDay(hoursJson, dayOfWeek);
        const capacity = loc.stylist_capacity || 4;
        dayAvailableHours += operatingHours * capacity;
      });

      dailyMap.set(dateStr, {
        date: dateStr,
        dayName: format(currentDate, 'EEE'),
        availableHours: dayAvailableHours,
        bookedHours: 0,
        utilizationPercent: 0,
        appointmentCount: 0,
        revenue: 0,
        gapHours: dayAvailableHours,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process appointments
    appointments.forEach(apt => {
      const dateStr = apt.appointment_date;
      const dayData = dailyMap.get(dateStr);
      if (!dayData) return;

      // Calculate duration
      let durationHours = 1; // Default 1 hour
      if (apt.start_time && apt.end_time) {
        const [startH, startM] = apt.start_time.split(':').map(Number);
        const [endH, endM] = apt.end_time.split(':').map(Number);
        durationHours = (endH + endM / 60) - (startH + startM / 60);
        if (durationHours <= 0) durationHours = 1;
      }

      const revenue = Number(apt.total_price) || 0;

      dayData.bookedHours += durationHours;
      dayData.appointmentCount += 1;
      dayData.revenue += revenue;

      // Service mix
      const category = getServiceCategory(apt.service_name || 'Other');
      const existing = serviceMixMap.get(category) || { category, hours: 0, revenue: 0, count: 0, percentage: 0 };
      existing.hours += durationHours;
      existing.revenue += revenue;
      existing.count += 1;
      serviceMixMap.set(category, existing);
    });

    // Calculate utilization percentages and gap hours
    dailyMap.forEach((day) => {
      if (day.availableHours > 0) {
        day.utilizationPercent = Math.round((day.bookedHours / day.availableHours) * 100);
      }
      day.gapHours = Math.max(0, day.availableHours - day.bookedHours);
    });

    // Aggregate totals
    let totalAvailableHours = 0;
    let totalBookedHours = 0;
    let totalRevenue = 0;
    let totalAppointments = 0;

    dailyMap.forEach((day) => {
      totalAvailableHours += day.availableHours;
      totalBookedHours += day.bookedHours;
      totalRevenue += day.revenue;
      totalAppointments += day.appointmentCount;
    });

    const overallUtilization = totalAvailableHours > 0 
      ? Math.round((totalBookedHours / totalAvailableHours) * 100)
      : 0;

    const gapHours = Math.max(0, totalAvailableHours - totalBookedHours);
    const avgHourlyRevenue = totalBookedHours > 0 ? Math.round(totalRevenue / totalBookedHours) : 0;
    const gapRevenue = Math.round(gapHours * avgHourlyRevenue);

    // Calculate service mix percentages
    const totalServiceHours = Array.from(serviceMixMap.values()).reduce((sum, s) => sum + s.hours, 0);
    serviceMixMap.forEach((service) => {
      service.percentage = totalServiceHours > 0 ? Math.round((service.hours / totalServiceHours) * 100) : 0;
    });

    // Find peak and low days (only days with availability)
    const dailyCapacity = Array.from(dailyMap.values());
    const daysWithAvailability = dailyCapacity.filter(d => d.availableHours > 0);
    
    let peakDay: DayCapacity | null = null;
    let lowDay: DayCapacity | null = null;
    
    if (daysWithAvailability.length > 0) {
      peakDay = daysWithAvailability.reduce((max, day) => 
        day.utilizationPercent > max.utilizationPercent ? day : max
      , daysWithAvailability[0]);
      
      lowDay = daysWithAvailability.reduce((min, day) => 
        day.utilizationPercent < min.utilizationPercent ? day : min
      , daysWithAvailability[0]);
    }

    return {
      totalAvailableHours: Math.round(totalAvailableHours),
      totalBookedHours: Math.round(totalBookedHours),
      overallUtilization,
      gapHours: Math.round(gapHours),
      gapRevenue,
      avgHourlyRevenue,
      dailyCapacity,
      serviceMix: Array.from(serviceMixMap.values()).sort((a, b) => b.hours - a.hours),
      totalAppointments,
      peakDay,
      lowDay,
    };
  })();

  return {
    capacityData,
    isLoading: locationsQuery.isLoading || appointmentsQuery.isLoading,
    error: locationsQuery.error || appointmentsQuery.error,
  };
}
