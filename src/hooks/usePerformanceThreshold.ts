import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceThreshold {
  minimumRevenue: number;
  evaluationPeriodDays: 30 | 60 | 90;
  alertsEnabled: boolean;
}

const DEFAULT_THRESHOLD: PerformanceThreshold = {
  minimumRevenue: 3000,
  evaluationPeriodDays: 30,
  alertsEnabled: true,
};

export function usePerformanceThreshold() {
  return useQuery({
    queryKey: ['site-settings', 'staff_performance_threshold'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'staff_performance_threshold')
        .maybeSingle();

      if (error) throw error;
      
      if (!data?.value) return DEFAULT_THRESHOLD;
      
      const value = data.value as unknown as PerformanceThreshold;
      return {
        minimumRevenue: value.minimumRevenue ?? DEFAULT_THRESHOLD.minimumRevenue,
        evaluationPeriodDays: value.evaluationPeriodDays ?? DEFAULT_THRESHOLD.evaluationPeriodDays,
        alertsEnabled: value.alertsEnabled ?? DEFAULT_THRESHOLD.alertsEnabled,
      };
    },
  });
}

export function useUpdatePerformanceThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threshold: PerformanceThreshold) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          id: 'staff_performance_threshold',
          value: threshold as never,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'staff_performance_threshold'] });
      queryClient.invalidateQueries({ queryKey: ['staff-revenue-performance'] });
    },
  });
}
