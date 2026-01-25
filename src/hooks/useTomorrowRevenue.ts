import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export function useTomorrowRevenue() {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['tomorrow-revenue', tomorrowStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_appointments')
        .select('total_price, status')
        .eq('appointment_date', tomorrowStr)
        .not('status', 'in', '("cancelled","no_show")');

      if (error) throw error;

      const appointments = data || [];
      const totalRevenue = appointments.reduce(
        (sum, apt) => sum + (Number(apt.total_price) || 0), 
        0
      );

      return {
        revenue: totalRevenue,
        appointmentCount: appointments.length,
        date: tomorrowStr,
      };
    },
  });
}
