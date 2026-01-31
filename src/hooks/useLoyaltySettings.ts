import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoyaltySettings {
  id: string;
  organization_id: string;
  is_enabled: boolean;
  program_name: string;
  points_per_dollar: number;
  service_multiplier: number;
  product_multiplier: number;
  points_to_dollar_ratio: number;
  minimum_redemption_points: number;
  points_expire: boolean;
  points_expiration_days: number;
  bonus_rules: BonusRule[];
  created_at: string;
  updated_at: string;
}

export interface BonusRule {
  type: 'birthday' | 'first_visit' | 'referral' | 'double_points_day';
  bonus_points?: number;
  multiplier?: number;
  day_of_week?: number;
}

export function useLoyaltySettings(organizationId?: string) {
  return useQuery({
    queryKey: ['loyalty-settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_program_settings' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as LoyaltySettings | null;
    },
    enabled: !!organizationId,
  });
}

export function useUpdateLoyaltySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      settings 
    }: { 
      organizationId: string; 
      settings: Partial<LoyaltySettings> 
    }) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('loyalty_program_settings' as any)
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('loyalty_program_settings' as any)
          .update({ ...settings, updated_at: new Date().toISOString() } as any)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('loyalty_program_settings' as any)
          .insert({ organization_id: organizationId, ...settings } as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings', variables.organizationId] });
      toast.success('Loyalty settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });
}
