import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';

export function useDismissedSuggestions() {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const { data: dismissedKeys = new Set<string>(), isLoading } = useQuery({
    queryKey: ['dismissed-suggestions', user?.id, orgId],
    queryFn: async () => {
      if (!user || !orgId) return new Set<string>();

      const { data, error } = await supabase
        .from('dismissed_insight_suggestions' as any)
        .select('suggestion_key')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return new Set((data as any[])?.map((d) => d.suggestion_key) || []);
    },
    enabled: !!user && !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (suggestionKey: string) => {
      if (!user || !orgId) throw new Error('Not authenticated');

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('dismissed_insight_suggestions' as any)
        .upsert(
          {
            organization_id: orgId,
            user_id: user.id,
            suggestion_key: suggestionKey,
            dismissed_at: new Date().toISOString(),
            expires_at: expiresAt,
          } as any,
          { onConflict: 'organization_id,user_id,suggestion_key' as any }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dismissed-suggestions', user?.id, orgId] });
    },
    onError: () => {
      toast.error('Failed to dismiss suggestion');
    },
  });

  return {
    dismissedKeys,
    isLoading,
    dismiss: dismissMutation.mutate,
    isDismissing: dismissMutation.isPending,
  };
}
