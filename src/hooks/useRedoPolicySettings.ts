import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface RedoPolicySettings {
  redo_pricing_policy: 'free' | 'percentage' | 'full_price';
  redo_pricing_percentage: number;
  redo_requires_approval: boolean;
  redo_approval_roles: string[];
  redo_reason_required: boolean;
  redo_window_days: number;
  redo_notification_enabled: boolean;
}

export const REDO_POLICY_DEFAULTS: RedoPolicySettings = {
  redo_pricing_policy: 'free',
  redo_pricing_percentage: 50,
  redo_requires_approval: false,
  redo_approval_roles: ['admin', 'manager'],
  redo_reason_required: true,
  redo_window_days: 14,
  redo_notification_enabled: true,
};

export const REDO_REASONS = [
  'Color didn\'t hold',
  'Uneven cut / missed spots',
  'Client dissatisfied with style',
  'Processing error',
  'Texture / curl pattern issue',
  'Other',
] as const;

export function useRedoPolicySettings() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['redo-policy', orgId],
    queryFn: async (): Promise<RedoPolicySettings> => {
      if (!orgId) return REDO_POLICY_DEFAULTS;
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      if (error || !data?.settings) return REDO_POLICY_DEFAULTS;
      const s = data.settings as Record<string, unknown>;
      return {
        redo_pricing_policy: (s.redo_pricing_policy as RedoPolicySettings['redo_pricing_policy']) ?? REDO_POLICY_DEFAULTS.redo_pricing_policy,
        redo_pricing_percentage: (s.redo_pricing_percentage as number) ?? REDO_POLICY_DEFAULTS.redo_pricing_percentage,
        redo_requires_approval: (s.redo_requires_approval as boolean) ?? REDO_POLICY_DEFAULTS.redo_requires_approval,
        redo_approval_roles: (s.redo_approval_roles as string[]) ?? REDO_POLICY_DEFAULTS.redo_approval_roles,
        redo_reason_required: (s.redo_reason_required as boolean) ?? REDO_POLICY_DEFAULTS.redo_reason_required,
        redo_window_days: (s.redo_window_days as number) ?? REDO_POLICY_DEFAULTS.redo_window_days,
        redo_notification_enabled: (s.redo_notification_enabled as boolean) ?? REDO_POLICY_DEFAULTS.redo_notification_enabled,
      };
    },
    enabled: !!orgId,
  });
}

export function useUpdateRedoPolicy() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<RedoPolicySettings>) => {
      if (!orgId) throw new Error('No organization');
      // Fetch current settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      const currentSettings = (org?.settings as Record<string, unknown>) || {};
      const newSettings = { ...currentSettings, ...updates };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: newSettings } as any)
        .eq('id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redo-policy', orgId] });
      toast.success('Redo policy updated');
    },
    onError: (e: Error) => {
      toast.error('Failed to update redo policy', { description: e.message });
    },
  });
}
