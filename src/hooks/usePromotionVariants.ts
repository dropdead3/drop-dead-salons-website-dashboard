import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PromotionVariant {
  id: string;
  promotion_id: string;
  variant_name: string;
  variant_code: string | null;
  discount_value: number | null;
  discount_type: 'percentage' | 'fixed' | null;
  description: string | null;
  views: number;
  redemptions: number;
  revenue_generated: number;
  is_control: boolean;
  is_active: boolean;
  created_at: string;
  // Computed
  conversion_rate?: number;
}

export interface CreateVariantData {
  promotion_id: string;
  variant_name: string;
  variant_code?: string;
  discount_value?: number;
  discount_type?: 'percentage' | 'fixed';
  description?: string;
  is_control?: boolean;
}

export function usePromotionVariants(promotionId: string | undefined) {
  return useQuery({
    queryKey: ['promotion-variants', promotionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_variants' as any)
        .select('*')
        .eq('promotion_id', promotionId!)
        .order('is_control', { ascending: false });

      if (error) throw error;

      return (data || []).map((variant: any) => ({
        ...variant,
        conversion_rate: variant.views > 0 ? (variant.redemptions / variant.views) * 100 : 0,
      })) as PromotionVariant[];
    },
    enabled: !!promotionId,
  });
}

export function useCreatePromotionVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVariantData) => {
      const { data: variant, error } = await supabase
        .from('promotion_variants' as any)
        .insert({
          ...data,
          is_active: true,
          views: 0,
          redemptions: 0,
          revenue_generated: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return variant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-variants'] });
      toast.success('Variant created');
    },
    onError: (error) => {
      toast.error('Failed to create variant', { description: error.message });
    },
  });
}

export function useUpdatePromotionVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromotionVariant> & { id: string }) => {
      const { data, error } = await supabase
        .from('promotion_variants' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-variants'] });
      toast.success('Variant updated');
    },
    onError: (error) => {
      toast.error('Failed to update variant', { description: error.message });
    },
  });
}

export function useDeletePromotionVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from('promotion_variants' as any)
        .delete()
        .eq('id', variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-variants'] });
      toast.success('Variant deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete variant', { description: error.message });
    },
  });
}

export function useIncrementVariantView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: string) => {
      const { data: current, error: fetchError } = await supabase
        .from('promotion_variants' as any)
        .select('views')
        .eq('id', variantId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('promotion_variants' as any)
        .update({ views: (current as any).views + 1 } as any)
        .eq('id', variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-variants'] });
    },
  });
}

export function useRecordVariantRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      revenue,
    }: {
      variantId: string;
      revenue: number;
    }) => {
      const { data: current, error: fetchError } = await supabase
        .from('promotion_variants' as any)
        .select('redemptions, revenue_generated')
        .eq('id', variantId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('promotion_variants' as any)
        .update({
          redemptions: (current as any).redemptions + 1,
          revenue_generated: (current as any).revenue_generated + revenue,
        } as any)
        .eq('id', variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-variants'] });
    },
  });
}

export function useVariantABTestResults(promotionId: string | undefined) {
  return useQuery({
    queryKey: ['variant-ab-test-results', promotionId],
    queryFn: async () => {
      const { data: variants, error } = await supabase
        .from('promotion_variants' as any)
        .select('*')
        .eq('promotion_id', promotionId!)
        .eq('is_active', true);

      if (error) throw error;
      if (!variants || variants.length < 2) return null;

      const control = (variants as any[]).find(v => v.is_control);
      const challenger = (variants as any[]).find(v => !v.is_control);

      if (!control || !challenger) return null;

      const controlRate = control.views > 0 ? control.redemptions / control.views : 0;
      const challengerRate = challenger.views > 0 ? challenger.redemptions / challenger.views : 0;

      // Simple statistical significance check (chi-squared approximation)
      const totalViews = control.views + challenger.views;
      const totalConversions = control.redemptions + challenger.redemptions;
      const expectedRate = totalViews > 0 ? totalConversions / totalViews : 0;

      const controlExpected = control.views * expectedRate;
      const challengerExpected = challenger.views * expectedRate;

      let chiSquared = 0;
      if (controlExpected > 0) {
        chiSquared += Math.pow(control.redemptions - controlExpected, 2) / controlExpected;
      }
      if (challengerExpected > 0) {
        chiSquared += Math.pow(challenger.redemptions - challengerExpected, 2) / challengerExpected;
      }

      // Chi-squared critical value for 95% confidence with 1 df is 3.841
      const isSignificant = chiSquared > 3.841;
      const winner = challengerRate > controlRate ? challenger : control;
      const lift = controlRate > 0 ? ((challengerRate - controlRate) / controlRate) * 100 : 0;

      return {
        control: {
          ...control,
          conversion_rate: controlRate * 100,
        },
        challenger: {
          ...challenger,
          conversion_rate: challengerRate * 100,
        },
        is_significant: isSignificant,
        chi_squared: chiSquared,
        winner_id: isSignificant ? winner.id : null,
        lift_percentage: lift,
        confidence_level: isSignificant ? 95 : null,
      };
    },
    enabled: !!promotionId,
  });
}
