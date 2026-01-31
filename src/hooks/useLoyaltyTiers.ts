import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoyaltyTier {
  id: string;
  organization_id: string;
  tier_name: string;
  tier_key: string;
  minimum_lifetime_points: number;
  points_multiplier: number;
  perks: string[];
  sort_order: number;
  color: string;
  icon: string;
  created_at: string;
}

export function useLoyaltyTiers(organizationId?: string) {
  return useQuery({
    queryKey: ['loyalty-tiers', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as LoyaltyTier[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateLoyaltyTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tier: Partial<LoyaltyTier> & { organization_id: string }) => {
      const { data, error } = await supabase
        .from('loyalty_tiers' as any)
        .insert(tier as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers', variables.organization_id] });
      toast.success('Tier created');
    },
    onError: (error) => {
      toast.error('Failed to create tier: ' + error.message);
    },
  });
}

export function useUpdateLoyaltyTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LoyaltyTier> }) => {
      const { data, error } = await supabase
        .from('loyalty_tiers' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Tier updated');
    },
    onError: (error) => {
      toast.error('Failed to update tier: ' + error.message);
    },
  });
}

export function useDeleteLoyaltyTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loyalty_tiers' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Tier deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete tier: ' + error.message);
    },
  });
}

export function useInitializeDefaultTiers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const defaultTiers = [
        { tier_name: 'Bronze', tier_key: 'bronze', minimum_lifetime_points: 0, points_multiplier: 1.0, color: '#cd7f32', sort_order: 0, perks: ['Birthday discount: 10%'] },
        { tier_name: 'Silver', tier_key: 'silver', minimum_lifetime_points: 500, points_multiplier: 1.25, color: '#c0c0c0', sort_order: 1, perks: ['Birthday discount: 15%', 'Free product sample'] },
        { tier_name: 'Gold', tier_key: 'gold', minimum_lifetime_points: 2000, points_multiplier: 1.5, color: '#ffd700', sort_order: 2, perks: ['Birthday discount: 20%', 'Priority booking', 'Free gift wrapping'] },
        { tier_name: 'Platinum', tier_key: 'platinum', minimum_lifetime_points: 5000, points_multiplier: 2.0, color: '#e5e4e2', sort_order: 3, perks: ['Birthday discount: 25%', 'VIP events access', 'Exclusive products', 'Personal stylist'] },
      ];

      const { error } = await supabase
        .from('loyalty_tiers' as any)
        .insert(defaultTiers.map(t => ({ ...t, organization_id: organizationId })) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Default tiers created');
    },
    onError: (error) => {
      toast.error('Failed to create tiers: ' + error.message);
    },
  });
}
