import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SEOWorkshopCompletionRow {
  id: string;
  organization_id: string;
  action_key: string;
  completed_at: string;
  notes: string | null;
}

/**
 * Returns completions for the organization. Keyed by action_key for easy lookup.
 */
export function useSEOWorkshopProgress(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['seo-workshop-progress', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_workshop_completions' as any)
        .select('*')
        .eq('organization_id', organizationId!);

      if (error) throw error;
      return (data || []) as unknown as SEOWorkshopCompletionRow[];
    },
    enabled: !!organizationId,
  });
}

/**
 * Mark an action as complete. Upserts so re-checking is idempotent.
 */
export function useCompleteSEOWorkshopAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      actionKey,
      notes,
    }: {
      organizationId: string;
      actionKey: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('seo_workshop_completions' as any)
        .upsert(
          {
            organization_id: organizationId,
            action_key: actionKey,
            completed_at: new Date().toISOString(),
            notes: notes ?? null,
          },
          { onConflict: 'organization_id,action_key' } // unique constraint on (organization_id, action_key)
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SEOWorkshopCompletionRow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seo-workshop-progress', variables.organizationId] });
      toast.success('Action marked complete');
    },
    onError: (error: Error) => {
      toast.error('Failed to update', { description: error.message });
    },
  });
}

/**
 * Remove a completion (uncomplete).
 */
export function useUncompleteSEOWorkshopAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      actionKey,
    }: {
      organizationId: string;
      actionKey: string;
    }) => {
      const { error } = await supabase
        .from('seo_workshop_completions' as any)
        .delete()
        .eq('organization_id', organizationId)
        .eq('action_key', actionKey);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seo-workshop-progress', variables.organizationId] });
      toast.success('Action unchecked');
    },
    onError: (error: Error) => {
      toast.error('Failed to update', { description: error.message });
    },
  });
}
