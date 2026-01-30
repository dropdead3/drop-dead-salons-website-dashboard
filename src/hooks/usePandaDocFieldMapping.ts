import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PandaDocFieldMapping {
  [pandaDocField: string]: string;
}

export const DEFAULT_PANDADOC_MAPPING: PandaDocFieldMapping = {
  term_start_date: 'contract_start_date',
  term_end_date: 'contract_end_date',
  subscription_plan: 'plan_name_lookup',
  monthly_rate: 'custom_price',
  promo_months: 'promo_months',
  promo_rate: 'promo_price',
  setup_fee: 'setup_fee',
  special_notes: 'notes',
};

export const BILLING_COLUMNS = [
  { value: 'contract_start_date', label: 'Contract Start Date', type: 'date' },
  { value: 'contract_end_date', label: 'Contract End Date', type: 'date' },
  { value: 'plan_name_lookup', label: 'Plan (lookup by name)', type: 'special' },
  { value: 'custom_price', label: 'Monthly Rate', type: 'number' },
  { value: 'base_price', label: 'Base Price', type: 'number' },
  { value: 'promo_months', label: 'Promo Months', type: 'integer' },
  { value: 'promo_price', label: 'Promo Price', type: 'number' },
  { value: 'promo_ends_at', label: 'Promo End Date', type: 'date' },
  { value: 'setup_fee', label: 'Setup Fee', type: 'number' },
  { value: 'trial_days', label: 'Trial Days', type: 'integer' },
  { value: 'billing_cycle', label: 'Billing Cycle', type: 'enum' },
  { value: 'notes', label: 'Special Notes', type: 'text' },
  { value: 'discount_value', label: 'Discount Value', type: 'number' },
  { value: 'per_location_fee', label: 'Per Location Fee', type: 'number' },
  { value: 'per_user_fee', label: 'Per User Fee', type: 'number' },
  { value: 'included_locations', label: 'Included Locations', type: 'integer' },
  { value: 'included_users', label: 'Included Users', type: 'integer' },
] as const;

export function usePandaDocFieldMapping() {
  return useQuery({
    queryKey: ['site-settings', 'pandadoc_field_mapping'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'pandadoc_field_mapping')
        .maybeSingle();

      if (error) {
        console.error('Error fetching PandaDoc field mapping:', error);
        throw error;
      }

      // Return saved mapping or default
      return (data?.value as PandaDocFieldMapping) || DEFAULT_PANDADOC_MAPPING;
    },
  });
}

export function useUpdatePandaDocFieldMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: PandaDocFieldMapping) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upsert the mapping
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 'pandadoc_field_mapping',
          value: mapping as never,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'pandadoc_field_mapping'] });
      toast.success('Field mapping saved successfully');
    },
    onError: (error) => {
      console.error('Error saving field mapping:', error);
      toast.error('Failed to save field mapping');
    },
  });
}
