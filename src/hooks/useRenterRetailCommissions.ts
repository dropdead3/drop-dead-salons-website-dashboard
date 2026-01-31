import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, startOfYear } from 'date-fns';

export interface RenterRetailCommission {
  id: string;
  organization_id: string;
  booth_renter_id: string;
  retail_sale_id: string | null;
  sale_date: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  payout_status: 'pending' | 'included_in_statement' | 'paid';
  payout_date: string | null;
  payout_reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface CommissionSummary {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
}

export function useRenterCommissions(boothRenterId: string | undefined, filters: {
  startDate?: string;
  endDate?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: ['renter-commissions', boothRenterId, filters],
    queryFn: async () => {
      let query = supabase
        .from('renter_retail_commissions' as any)
        .select('*')
        .eq('booth_renter_id', boothRenterId!)
        .order('sale_date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('sale_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('sale_date', filters.endDate);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('payout_status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as any[]) as RenterRetailCommission[];
    },
    enabled: !!boothRenterId,
  });
}

export function useRenterCommissionSummary(boothRenterId: string | undefined) {
  return useQuery({
    queryKey: ['renter-commission-summary', boothRenterId],
    queryFn: async (): Promise<CommissionSummary> => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString().split('T')[0];
      const monthEnd = endOfMonth(now).toISOString().split('T')[0];
      const yearStart = startOfYear(now).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('renter_retail_commissions' as any)
        .select('commission_amount, payout_status, sale_date')
        .eq('booth_renter_id', boothRenterId!);

      if (error) throw error;

      let totalEarned = 0;
      let totalPending = 0;
      let totalPaid = 0;
      let monthlyEarnings = 0;
      let yearlyEarnings = 0;

      ((data as any[]) || []).forEach((c: any) => {
        totalEarned += c.commission_amount;

        if (c.payout_status === 'pending' || c.payout_status === 'included_in_statement') {
          totalPending += c.commission_amount;
        } else if (c.payout_status === 'paid') {
          totalPaid += c.commission_amount;
        }

        if (c.sale_date >= monthStart && c.sale_date <= monthEnd) {
          monthlyEarnings += c.commission_amount;
        }

        if (c.sale_date >= yearStart) {
          yearlyEarnings += c.commission_amount;
        }
      });

      return {
        totalEarned,
        totalPending,
        totalPaid,
        monthlyEarnings,
        yearlyEarnings,
      };
    },
    enabled: !!boothRenterId,
  });
}

export function useRecordCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organization_id: string;
      booth_renter_id: string;
      retail_sale_id?: string;
      sale_date: string;
      sale_amount: number;
      commission_rate: number;
      notes?: string;
    }) => {
      const commission_amount = data.sale_amount * data.commission_rate;

      const { data: commission, error } = await supabase
        .from('renter_retail_commissions' as any)
        .insert({
          organization_id: data.organization_id,
          booth_renter_id: data.booth_renter_id,
          retail_sale_id: data.retail_sale_id || null,
          sale_date: data.sale_date,
          sale_amount: data.sale_amount,
          commission_rate: data.commission_rate,
          commission_amount,
          notes: data.notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return commission;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renter-commissions', variables.booth_renter_id] });
      queryClient.invalidateQueries({ queryKey: ['renter-commission-summary', variables.booth_renter_id] });
      toast.success('Commission recorded');
    },
    onError: (error) => {
      toast.error('Failed to record commission', { description: error.message });
    },
  });
}

export function useMarkCommissionsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commissionIds, payoutReference }: { commissionIds: string[]; payoutReference: string }) => {
      const { error } = await supabase
        .from('renter_retail_commissions' as any)
        .update({
          payout_status: 'paid',
          payout_date: new Date().toISOString().split('T')[0],
          payout_reference: payoutReference,
        } as any)
        .in('id', commissionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['renter-commission-summary'] });
      toast.success('Commissions marked as paid');
    },
    onError: (error) => {
      toast.error('Failed to update commissions', { description: error.message });
    },
  });
}
