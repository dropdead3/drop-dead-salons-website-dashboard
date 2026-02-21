import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface MergeRequest {
  primaryClientId: string;
  secondaryClientIds: string[];
  fieldResolutions: Record<string, any>;
}

export function useExecuteMerge() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (request: MergeRequest) => {
      const { data, error } = await supabase.functions.invoke('merge-clients', {
        body: {
          ...request,
          organizationId: effectiveOrganization?.id,
        },
      });

      if (error) throw new Error(error.message || 'Merge failed');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients-data'] });
      queryClient.invalidateQueries({ queryKey: ['client-search'] });
      queryClient.invalidateQueries({ queryKey: ['client-directory'] });
      queryClient.invalidateQueries({ queryKey: ['merge-audit-log'] });
      toast.success('Clients merged successfully', {
        description: `Merge log ID: ${data.mergeLogId}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Merge failed', { description: error.message });
    },
  });
}

export function useUndoMerge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mergeLogId: string) => {
      const { data, error } = await supabase.functions.invoke('undo-merge', {
        body: { mergeLogId },
      });

      if (error) throw new Error(error.message || 'Undo failed');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-data'] });
      queryClient.invalidateQueries({ queryKey: ['client-search'] });
      queryClient.invalidateQueries({ queryKey: ['client-directory'] });
      queryClient.invalidateQueries({ queryKey: ['merge-audit-log'] });
      toast.success('Merge undone successfully');
    },
    onError: (error: Error) => {
      toast.error('Undo failed', { description: error.message });
    },
  });
}

export function useMergeAuditLog(organizationId?: string) {
  return useQuery({
    queryKey: ['merge-audit-log', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_merge_log')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useClientRecordCounts(clientIds: string[]) {
  return useQuery({
    queryKey: ['client-record-counts', clientIds],
    queryFn: async () => {
      const counts: Record<string, { appointments: number; notes: number; totalSpend: number }> = {};

      for (const id of clientIds) {
        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', id);

        const { data: client } = await supabase
          .from('clients')
          .select('total_spend, notes')
          .eq('id', id)
          .single();

        counts[id] = {
          appointments: apptCount || 0,
          notes: client?.notes ? 1 : 0,
          totalSpend: Number(client?.total_spend || 0),
        };
      }

      return counts;
    },
    enabled: clientIds.length > 0,
  });
}
