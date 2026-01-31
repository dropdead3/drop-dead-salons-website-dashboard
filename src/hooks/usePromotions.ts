import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Promotion {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  promo_code: string | null;
  promotion_type: 'percentage_discount' | 'fixed_discount' | 'bogo' | 'bundle' | 'new_client' | 'loyalty_bonus' | 'referral';
  discount_value: number | null;
  discount_max_amount: number | null;
  minimum_purchase: number;
  applies_to: 'all' | 'services' | 'products' | 'specific';
  applicable_service_ids: string[] | null;
  applicable_category: string[] | null;
  excluded_service_ids: string[] | null;
  usage_limit: number | null;
  usage_per_client: number;
  current_usage_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  target_audience: 'all' | 'new_clients' | 'existing_clients' | 'loyalty_tier' | 'specific_clients';
  target_loyalty_tiers: string[] | null;
  target_client_ids: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PromotionInsert = Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'current_usage_count'>;

export function usePromotions(organizationId?: string) {
  return useQuery({
    queryKey: ['promotions', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('promotions' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Promotion[];
    },
    enabled: !!organizationId,
  });
}

export function useActivePromotions(organizationId?: string) {
  return useQuery({
    queryKey: ['promotions', 'active', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Promotion[];
    },
    enabled: !!organizationId,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotion: PromotionInsert) => {
      const { data, error } = await supabase
        .from('promotions' as any)
        .insert(promotion as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', variables.organization_id] });
      toast.success('Promotion created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create promotion: ' + error.message);
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Promotion> & { id: string }) => {
      const { data, error } = await supabase
        .from('promotions' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.organization_id] });
      toast.success('Promotion updated');
    },
    onError: (error) => {
      toast.error('Failed to update promotion: ' + error.message);
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('promotions' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', variables.organizationId] });
      toast.success('Promotion deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete promotion: ' + error.message);
    },
  });
}

export function useValidatePromoCode(organizationId?: string) {
  return useMutation({
    mutationFn: async (code: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('promo_code', code.toUpperCase())
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Invalid or expired promo code');
        }
        throw error;
      }
      
      const promotion = data as unknown as Promotion;
      
      // Check usage limit
      if (promotion.usage_limit && promotion.current_usage_count >= promotion.usage_limit) {
        throw new Error('This promo code has reached its usage limit');
      }
      
      return promotion;
    },
  });
}
