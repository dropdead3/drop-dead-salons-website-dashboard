import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for persisting per-page analytics card ordering.
 * Stores/reads from user_preferences.dashboard_layout.analyticsCardOrder
 * which is a map of pageId -> cardId[].
 */
export function useAnalyticsCardOrder(pageId: string, defaultOrder: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedOrder } = useQuery({
    queryKey: ['analytics-card-order', user?.id, pageId],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('dashboard_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching analytics card order:', error);
      }

      const layout = data?.dashboard_layout as Record<string, unknown> | null;
      const analyticsCardOrder = layout?.analyticsCardOrder as Record<string, string[]> | undefined;
      return analyticsCardOrder?.[pageId] || null;
    },
    enabled: !!user?.id,
  });

  // Merge saved order with defaults (in case new cards were added)
  const orderedIds = (() => {
    if (!savedOrder) return defaultOrder;
    const result = [...savedOrder.filter(id => defaultOrder.includes(id))];
    const missing = defaultOrder.filter(id => !result.includes(id));
    return [...result, ...missing];
  })();

  const saveOrderMutation = useMutation({
    mutationFn: async (newOrder: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Read current dashboard_layout
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id, dashboard_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentLayout = (existing?.dashboard_layout as Record<string, unknown>) || {};
      const currentAnalyticsOrder = (currentLayout.analyticsCardOrder as Record<string, string[]>) || {};

      const updatedLayout = {
        ...currentLayout,
        analyticsCardOrder: {
          ...currentAnalyticsOrder,
          [pageId]: newOrder,
        },
      };

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ dashboard_layout: updatedLayout })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, dashboard_layout: updatedLayout });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-card-order', user?.id, pageId] });
    },
  });

  const resetOrder = () => {
    saveOrderMutation.mutate(defaultOrder);
  };

  return {
    orderedIds,
    saveOrder: (ids: string[]) => saveOrderMutation.mutate(ids),
    resetOrder,
    isSaving: saveOrderMutation.isPending,
  };
}
