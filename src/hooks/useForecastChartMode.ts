import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ForecastChartMode = 'category' | 'solid';

export function useForecastChartMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: mode = 'category' } = useQuery({
    queryKey: ['user-preferences', user?.id, 'forecastChartMode'],
    queryFn: async () => {
      if (!user?.id) return 'category' as ForecastChartMode;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('dashboard_layout')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      const layout = data?.dashboard_layout as Record<string, unknown> | null;
      return (layout?.forecastChartMode as ForecastChartMode) || 'category';
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: setMode } = useMutation({
    mutationFn: async (newMode: ForecastChartMode) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Read current dashboard_layout
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id, dashboard_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentLayout = (existing?.dashboard_layout as Record<string, unknown>) || {};
      const updatedLayout = { ...currentLayout, forecastChartMode: newMode };

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ dashboard_layout: updatedLayout })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, dashboard_layout: updatedLayout }]);
        if (error) throw error;
      }
    },
    onMutate: async (newMode) => {
      // Optimistic update
      queryClient.setQueryData(['user-preferences', user?.id, 'forecastChartMode'], newMode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  return { mode, setMode };
}
