import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RenterPaymentMethod {
  id: string;
  booth_renter_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  autopay_enabled: boolean;
  autopay_days_before_due: number;
  created_at: string;
  updated_at: string;
}

export interface AddPaymentMethodData {
  booth_renter_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default?: boolean;
  autopay_enabled?: boolean;
  autopay_days_before_due?: number;
}

export function useRenterPaymentMethods(boothRenterId: string | undefined) {
  return useQuery({
    queryKey: ['renter-payment-methods', boothRenterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renter_payment_methods' as any)
        .select('*')
        .eq('booth_renter_id', boothRenterId!)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data as unknown) as RenterPaymentMethod[];
    },
    enabled: !!boothRenterId,
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPaymentMethodData) => {
      // If this is the first payment method or marked as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from('renter_payment_methods' as any)
          .update({ is_default: false } as any)
          .eq('booth_renter_id', data.booth_renter_id);
      }

      const { data: method, error } = await supabase
        .from('renter_payment_methods' as any)
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return method;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-payment-methods'] });
      toast.success('Payment method added');
    },
    onError: (error) => {
      toast.error('Failed to add payment method', { description: error.message });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      boothRenterId,
      ...updates
    }: Partial<RenterPaymentMethod> & { id: string; boothRenterId: string }) => {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('renter_payment_methods' as any)
          .update({ is_default: false } as any)
          .eq('booth_renter_id', boothRenterId)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('renter_payment_methods' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-payment-methods'] });
      toast.success('Payment method updated');
    },
    onError: (error) => {
      toast.error('Failed to update payment method', { description: error.message });
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      const { error } = await supabase
        .from('renter_payment_methods' as any)
        .delete()
        .eq('id', methodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-payment-methods'] });
      toast.success('Payment method removed');
    },
    onError: (error) => {
      toast.error('Failed to remove payment method', { description: error.message });
    },
  });
}

export function useToggleAutopay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      methodId,
      enabled,
      daysBefore,
    }: {
      methodId: string;
      enabled: boolean;
      daysBefore?: number;
    }) => {
      const { data, error } = await supabase
        .from('renter_payment_methods' as any)
        .update({
          autopay_enabled: enabled,
          autopay_days_before_due: daysBefore ?? 0,
        } as any)
        .eq('id', methodId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renter-payment-methods'] });
      toast.success(variables.enabled ? 'Autopay enabled' : 'Autopay disabled');
    },
    onError: (error) => {
      toast.error('Failed to update autopay setting', { description: error.message });
    },
  });
}

export function useDefaultPaymentMethod(boothRenterId: string | undefined) {
  return useQuery({
    queryKey: ['renter-default-payment-method', boothRenterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renter_payment_methods' as any)
        .select('*')
        .eq('booth_renter_id', boothRenterId!)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown) as RenterPaymentMethod | null;
    },
    enabled: !!boothRenterId,
  });
}
