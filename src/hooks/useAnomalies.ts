import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export interface DetectedAnomaly {
  id: string;
  anomaly_type: string;
  severity: 'info' | 'warning' | 'critical';
  detected_at: string;
  metric_value: number;
  expected_value: number;
  deviation_percent: number;
  context: Record<string, unknown>;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  location_id: string | null;
}

export function useAnomalies(unacknowledgedOnly = true) {
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['anomalies', effectiveOrganization?.id, unacknowledgedOnly],
    queryFn: async (): Promise<DetectedAnomaly[]> => {
      if (!effectiveOrganization?.id) return [];

      let query = supabase
        .from('detected_anomalies')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .order('detected_at', { ascending: false });

      if (unacknowledgedOnly) {
        query = query.eq('is_acknowledged', false);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return (data || []) as DetectedAnomaly[];
    },
    enabled: !!effectiveOrganization?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useAcknowledgeAnomaly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ anomalyId, notes }: { anomalyId: string; notes?: string }) => {
      const { error } = await supabase
        .from('detected_anomalies')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', anomalyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });
}

export function useRunAnomalyDetection() {
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId?: string) => {
      if (!effectiveOrganization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: {
          organizationId: effectiveOrganization.id,
          locationId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });
}

export function getAnomalyIcon(type: string): string {
  switch (type) {
    case 'revenue_drop':
      return '📉';
    case 'revenue_spike':
      return '📈';
    case 'cancellation_spike':
      return '🚨';
    case 'no_show_surge':
      return '👻';
    case 'booking_drop':
      return '📉';
    default:
      return '⚠️';
  }
}

export function getAnomalyLabel(type: string): string {
  switch (type) {
    case 'revenue_drop':
      return 'Revenue Drop';
    case 'revenue_spike':
      return 'Revenue Spike';
    case 'cancellation_spike':
      return 'Cancellation Spike';
    case 'no_show_surge':
      return 'No-Show Surge';
    case 'booking_drop':
      return 'Booking Drop';
    default:
      return 'Anomaly';
  }
}
