import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';

export interface CommissionConfig {
  id: string;
  organization_id: string;
  name: string;
  commission_type: 'flat_rate' | 'tiered' | 'per_employee';
  default_rate: number;
  tiers: CommissionTier[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionTier {
  minRevenue: number;
  maxRevenue: number | null;
  rate: number;
}

export interface CommissionOverride {
  id: string;
  organization_id: string;
  config_id: string;
  user_id: string;
  override_rate: number;
  created_at: string;
  updated_at: string;
}

export interface StaffCommissionResult {
  userId: string;
  name: string;
  photoUrl: string | null;
  retailRevenue: number;
  commissionRate: number;
  commissionEarned: number;
  isOverride: boolean;
}

export function useCommissionConfig() {
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['retail-commission-config', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('retail_commission_config' as any)
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const d = data as any;
      return {
        ...d,
        tiers: Array.isArray(d.tiers) ? d.tiers : [],
      } as CommissionConfig;
    },
    enabled: !!orgId,
  });
}

export function useSaveCommissionConfig() {
  const queryClient = useQueryClient();
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useMutation({
    mutationFn: async (config: { id?: string; name?: string; commissionType: CommissionConfig['commission_type']; defaultRate: number; tiers?: CommissionTier[] }) => {
      if (!orgId) throw new Error('No organization');
      const payload: any = {
        organization_id: orgId,
        name: config.name || 'Default',
        commission_type: config.commissionType,
        default_rate: config.defaultRate,
        tiers: config.tiers || [],
        is_active: true,
      };
      if (config.id) {
        const { data, error } = await supabase
          .from('retail_commission_config' as any)
          .update(payload)
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('retail_commission_config' as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-commission-config'] });
      toast.success('Commission config saved');
    },
    onError: (e) => toast.error('Failed to save commission config: ' + e.message),
  });
}

export function useCommissionOverrides(configId?: string) {
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['retail-commission-overrides', orgId, configId],
    queryFn: async () => {
      if (!orgId || !configId) return [];
      const { data, error } = await supabase
        .from('retail_commission_overrides' as any)
        .select('*')
        .eq('organization_id', orgId)
        .eq('config_id', configId);
      if (error) throw error;
      return (data || []) as unknown as CommissionOverride[];
    },
    enabled: !!orgId && !!configId,
  });
}

export function useSaveCommissionOverride() {
  const queryClient = useQueryClient();
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useMutation({
    mutationFn: async (override: { configId: string; userId: string; overrideRate: number }) => {
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('retail_commission_overrides' as any)
        .upsert({
          organization_id: orgId,
          config_id: override.configId,
          user_id: override.userId,
          override_rate: override.overrideRate,
        } as any, { onConflict: 'config_id,user_id' as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-commission-overrides'] });
      toast.success('Commission override saved');
    },
    onError: (e) => toast.error('Failed to save override: ' + e.message),
  });
}

/** Calculate commission for each staff member based on config + overrides */
export function calculateStaffCommissions(
  staffRetail: { userId: string | null; name: string; photoUrl: string | null; productRevenue: number }[],
  config: CommissionConfig | null,
  overrides: CommissionOverride[],
): StaffCommissionResult[] {
  if (!config) return [];

  const overrideMap = new Map(overrides.map(o => [o.user_id, o.override_rate]));

  return staffRetail.map(s => {
    let rate = config.default_rate;
    let isOverride = false;

    // Check per-employee override
    if (s.userId && overrideMap.has(s.userId)) {
      rate = overrideMap.get(s.userId)!;
      isOverride = true;
    } else if (config.commission_type === 'tiered' && config.tiers.length > 0) {
      // Find matching tier
      const sorted = [...config.tiers].sort((a, b) => a.minRevenue - b.minRevenue);
      for (const tier of sorted) {
        if (s.productRevenue >= tier.minRevenue && (tier.maxRevenue == null || s.productRevenue <= tier.maxRevenue)) {
          rate = tier.rate;
        }
      }
    }

    return {
      userId: s.userId || '',
      name: s.name,
      photoUrl: s.photoUrl,
      retailRevenue: s.productRevenue,
      commissionRate: rate,
      commissionEarned: s.productRevenue * (rate / 100),
      isOverride,
    };
  }).filter(s => s.retailRevenue > 0);
}
