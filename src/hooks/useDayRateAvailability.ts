import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

export interface DateAvailability {
  date: string;
  available: boolean;
  availableChairs: number;
  totalChairs: number;
  isBlackout: boolean;
  isFullyBooked: boolean;
  isPast: boolean;
}

export function useDayRateAvailability(locationId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['day-rate-availability', locationId, startDate, endDate],
    queryFn: async () => {
      // Get location settings including blackout dates
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('day_rate_enabled, day_rate_blackout_dates')
        .eq('id', locationId)
        .single();

      if (locationError) throw locationError;

      if (!location?.day_rate_enabled) {
        return [];
      }

      // Get all chairs for this location
      const { data: chairs, error: chairsError } = await supabase
        .from('day_rate_chairs')
        .select('id')
        .eq('location_id', locationId)
        .eq('is_available', true);

      if (chairsError) throw chairsError;

      const totalChairs = chairs?.length || 0;
      if (totalChairs === 0) return [];

      // Get all bookings in the date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('day_rate_bookings')
        .select('booking_date, chair_id')
        .eq('location_id', locationId)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .neq('status', 'cancelled');

      if (bookingsError) throw bookingsError;

      // Build a map of date -> booked chairs count
      const bookingsByDate: Record<string, number> = {};
      bookings?.forEach(b => {
        bookingsByDate[b.booking_date] = (bookingsByDate[b.booking_date] || 0) + 1;
      });

      // Parse blackout dates
      const blackoutDates = new Set(location.day_rate_blackout_dates || []);

      // Generate availability for each day
      const availability: DateAvailability[] = [];
      const today = startOfDay(new Date());
      let currentDate = parseISO(startDate);
      const end = parseISO(endDate);

      while (!isAfter(currentDate, end)) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const bookedCount = bookingsByDate[dateStr] || 0;
        const availableChairs = totalChairs - bookedCount;
        const isBlackout = blackoutDates.has(dateStr);
        const isPast = isBefore(currentDate, today);

        availability.push({
          date: dateStr,
          available: availableChairs > 0 && !isBlackout && !isPast,
          availableChairs,
          totalChairs,
          isBlackout,
          isFullyBooked: availableChairs === 0,
          isPast,
        });

        currentDate = addDays(currentDate, 1);
      }

      return availability;
    },
    enabled: !!locationId && !!startDate && !!endDate,
  });
}

// Check single date availability
export function useDateAvailability(locationId: string, date: string) {
  return useQuery({
    queryKey: ['day-rate-availability', locationId, date],
    queryFn: async () => {
      // Get location settings
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('day_rate_enabled, day_rate_blackout_dates')
        .eq('id', locationId)
        .single();

      if (locationError) throw locationError;

      if (!location?.day_rate_enabled) {
        return { available: false, reason: 'Day rate not enabled for this location' };
      }

      // Check if blackout date
      const blackoutDates = new Set(location.day_rate_blackout_dates || []);
      if (blackoutDates.has(date)) {
        return { available: false, reason: 'This date is not available' };
      }

      // Check if past date
      const today = startOfDay(new Date());
      if (isBefore(parseISO(date), today)) {
        return { available: false, reason: 'Cannot book past dates' };
      }

      // Get available chairs
      const { data: chairs, error: chairsError } = await supabase
        .from('day_rate_chairs')
        .select('id')
        .eq('location_id', locationId)
        .eq('is_available', true);

      if (chairsError) throw chairsError;

      const totalChairs = chairs?.length || 0;
      if (totalChairs === 0) {
        return { available: false, reason: 'No chairs available at this location' };
      }

      // Get bookings for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('day_rate_bookings')
        .select('chair_id')
        .eq('location_id', locationId)
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if (bookingsError) throw bookingsError;

      const bookedCount = bookings?.length || 0;
      const availableChairs = totalChairs - bookedCount;

      if (availableChairs === 0) {
        return { available: false, reason: 'All chairs are booked for this date' };
      }

      return { available: true, availableChairs, totalChairs };
    },
    enabled: !!locationId && !!date,
  });
}

// Get locations that have day rate enabled
export function useDayRateEnabledLocations() {
  return useQuery({
    queryKey: ['locations', 'day-rate-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('day_rate_enabled', true)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
