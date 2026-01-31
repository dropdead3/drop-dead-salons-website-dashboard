import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LateFeeConfig {
  id: string;
  organization_id: string;
  grace_period_days: number;
  late_fee_type: 'flat' | 'percentage' | 'daily';
  late_fee_amount: number | null;
  late_fee_percentage: number | null;
  daily_fee_amount: number | null;
  max_late_fee: number | null;
  auto_apply: boolean;
  send_reminder_days: number[];
  created_at: string;
  updated_at: string;
}

export interface UpdateLateFeeConfigData {
  grace_period_days?: number;
  late_fee_type?: 'flat' | 'percentage' | 'daily';
  late_fee_amount?: number;
  late_fee_percentage?: number;
  daily_fee_amount?: number;
  max_late_fee?: number;
  auto_apply?: boolean;
  send_reminder_days?: number[];
}

export function useLateFeeConfig(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['late-fee-config', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rent_late_fee_config' as any)
        .select('*')
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown) as LateFeeConfig | null;
    },
    enabled: !!organizationId,
  });
}

export function useCreateOrUpdateLateFeeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      ...config
    }: UpdateLateFeeConfigData & { organizationId: string }) => {
      // Check if config exists
      const { data: existing } = await supabase
        .from('rent_late_fee_config' as any)
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('rent_late_fee_config' as any)
          .update(config as any)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rent_late_fee_config' as any)
          .insert({
            organization_id: organizationId,
            ...config,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['late-fee-config'] });
      toast.success('Late fee configuration saved');
    },
    onError: (error) => {
      toast.error('Failed to save late fee configuration', { description: error.message });
    },
  });
}

export function calculateLateFee(
  config: LateFeeConfig | null,
  baseRent: number,
  daysOverdue: number
): number {
  if (!config || daysOverdue <= config.grace_period_days) {
    return 0;
  }

  let fee = 0;
  const effectiveDaysLate = daysOverdue - config.grace_period_days;

  switch (config.late_fee_type) {
    case 'flat':
      fee = config.late_fee_amount || 0;
      break;
    case 'percentage':
      fee = baseRent * (config.late_fee_percentage || 0);
      break;
    case 'daily':
      fee = (config.daily_fee_amount || 0) * effectiveDaysLate;
      break;
  }

  // Apply max cap if configured
  if (config.max_late_fee && fee > config.max_late_fee) {
    fee = config.max_late_fee;
  }

  return fee;
}
