import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
export interface ServiceLevelPrice {
  id: string;
  service_id: string;
  stylist_level_id: string;
  price: number;
  organization_id: string;
}

export interface StylistPriceOverride {
  id: string;
  service_id: string;
  employee_id: string;
  price: number;
  organization_id: string;
}

// ─── Level Prices ────────────────────────────────────────────────
export function useServiceLevelPrices(serviceId: string | null) {
  return useQuery({
    queryKey: ['service-level-prices', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_level_prices')
        .select('*')
        .eq('service_id', serviceId!);
      if (error) throw error;
      return data as ServiceLevelPrice[];
    },
    enabled: !!serviceId,
  });
}

export function useUpsertServiceLevelPrices() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (rows: { service_id: string; stylist_level_id: string; price: number }[]) => {
      const orgId = effectiveOrganization?.id;
      if (!orgId) throw new Error('No organization');

      const payload = rows.map(r => ({
        ...r,
        organization_id: orgId,
      }));

      const { error } = await supabase
        .from('service_level_prices')
        .upsert(payload, { onConflict: 'service_id,stylist_level_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const serviceId = vars[0]?.service_id;
      queryClient.invalidateQueries({ queryKey: ['service-level-prices', serviceId] });
      toast.success('Level prices saved');
    },
    onError: (e) => toast.error('Failed to save level prices: ' + e.message),
  });
}

// ─── Stylist Overrides ───────────────────────────────────────────
export function useStylistPriceOverrides(serviceId: string | null) {
  return useQuery({
    queryKey: ['stylist-price-overrides', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_stylist_price_overrides')
        .select('*')
        .eq('service_id', serviceId!);
      if (error) throw error;
      return data as StylistPriceOverride[];
    },
    enabled: !!serviceId,
  });
}

export function useUpsertStylistPriceOverride() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (row: { service_id: string; employee_id: string; price: number }) => {
      const orgId = effectiveOrganization?.id;
      if (!orgId) throw new Error('No organization');

      const { error } = await supabase
        .from('service_stylist_price_overrides')
        .upsert({ ...row, organization_id: orgId }, { onConflict: 'service_id,employee_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stylist-price-overrides', vars.service_id] });
      toast.success('Override saved');
    },
    onError: (e) => toast.error('Failed to save override: ' + e.message),
  });
}

export function useDeleteStylistPriceOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string }) => {
      const { error } = await supabase
        .from('service_stylist_price_overrides')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return serviceId;
    },
    onSuccess: (serviceId) => {
      queryClient.invalidateQueries({ queryKey: ['stylist-price-overrides', serviceId] });
      toast.success('Override removed');
    },
    onError: (e) => toast.error('Failed to remove override: ' + e.message),
  });
}
