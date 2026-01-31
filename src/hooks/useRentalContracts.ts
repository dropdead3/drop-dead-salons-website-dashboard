import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RentalContract {
  id: string;
  organization_id: string;
  booth_renter_id: string;
  contract_name: string;
  contract_type: 'standard' | 'month_to_month' | 'annual';
  pandadoc_document_id: string | null;
  pandadoc_status: 'draft' | 'sent' | 'viewed' | 'completed' | 'voided' | 'declined';
  document_url: string | null;
  signed_at: string | null;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  notice_period_days: number;
  rent_amount: number;
  rent_frequency: 'weekly' | 'monthly';
  due_day_of_week: number | null;
  due_day_of_month: number | null;
  security_deposit: number;
  security_deposit_paid: boolean;
  includes_utilities: boolean;
  includes_wifi: boolean;
  includes_products: boolean;
  additional_terms: Record<string, unknown> | null;
  retail_commission_enabled: boolean;
  retail_commission_rate: number;
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';
  terminated_at: string | null;
  termination_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  renter_name?: string;
  renter_business_name?: string;
}

export interface CreateContractData {
  organization_id: string;
  booth_renter_id: string;
  contract_name: string;
  contract_type?: 'standard' | 'month_to_month' | 'annual';
  start_date: string;
  end_date?: string;
  auto_renew?: boolean;
  notice_period_days?: number;
  rent_amount: number;
  rent_frequency: 'weekly' | 'monthly';
  due_day_of_week?: number;
  due_day_of_month?: number;
  security_deposit?: number;
  includes_utilities?: boolean;
  includes_wifi?: boolean;
  includes_products?: boolean;
  additional_terms?: Record<string, unknown>;
  retail_commission_enabled?: boolean;
  retail_commission_rate?: number;
}

export function useRentalContracts(boothRenterId?: string) {
  return useQuery({
    queryKey: ['rental-contracts', boothRenterId],
    queryFn: async () => {
      let query = supabase
        .from('booth_rental_contracts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (boothRenterId) {
        query = query.eq('booth_renter_id', boothRenterId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch renter profiles for display names
      const renterIds = [...new Set((data || []).map((c: any) => c.booth_renter_id))];
      const { data: profiles } = await supabase
        .from('booth_renter_profiles' as any)
        .select('id, business_name, user_id')
        .in('id', renterIds);

      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: employeeProfiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name')
        .in('user_id', userIds);

      const empMap = new Map((employeeProfiles || []).map(e => [e.user_id, e]));
      const profileMap = new Map((profiles || []).map((p: any) => {
        const emp = empMap.get(p.user_id);
        return [p.id, { business_name: p.business_name, name: emp?.display_name || emp?.full_name }];
      }));

      return (data || []).map((contract: any) => {
        const profile = profileMap.get(contract.booth_renter_id);
        return {
          ...contract,
          renter_name: profile?.name,
          renter_business_name: profile?.business_name,
        };
      }) as RentalContract[];
    },
    enabled: boothRenterId !== undefined,
  });
}

export function useActiveContract(boothRenterId: string | undefined) {
  return useQuery({
    queryKey: ['active-contract', boothRenterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booth_rental_contracts' as any)
        .select('*')
        .eq('booth_renter_id', boothRenterId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown) as RentalContract | null;
    },
    enabled: !!boothRenterId,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContractData) => {
      const { data: contract, error } = await supabase
        .from('booth_rental_contracts' as any)
        .insert({
          ...data,
          status: 'draft',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return contract;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['active-contract', variables.booth_renter_id] });
      toast.success('Contract created');
    },
    onError: (error) => {
      toast.error('Failed to create contract', { description: error.message });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RentalContract> & { id: string }) => {
      const { renter_name, renter_business_name, ...updateData } = data as any;
      const { data: updated, error } = await supabase
        .from('booth_rental_contracts' as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['active-contract'] });
      toast.success('Contract updated');
    },
    onError: (error) => {
      toast.error('Failed to update contract', { description: error.message });
    },
  });
}

export function useActivateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      // Get the contract to find the renter
      const { data: contract, error: fetchError } = await supabase
        .from('booth_rental_contracts' as any)
        .select('booth_renter_id')
        .eq('id', contractId)
        .single();

      if (fetchError) throw fetchError;

      // Deactivate any existing active contracts for this renter
      await supabase
        .from('booth_rental_contracts' as any)
        .update({ status: 'expired' } as any)
        .eq('booth_renter_id', (contract as any).booth_renter_id)
        .eq('status', 'active');

      // Activate the new contract
      const { data: updated, error } = await supabase
        .from('booth_rental_contracts' as any)
        .update({ status: 'active' } as any)
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;

      // Also activate the renter profile
      await supabase
        .from('booth_renter_profiles' as any)
        .update({ status: 'active' } as any)
        .eq('id', (contract as any).booth_renter_id);

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['active-contract'] });
      queryClient.invalidateQueries({ queryKey: ['booth-renters'] });
      toast.success('Contract activated');
    },
    onError: (error) => {
      toast.error('Failed to activate contract', { description: error.message });
    },
  });
}

export function useTerminateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: updated, error } = await supabase
        .from('booth_rental_contracts' as any)
        .update({
          status: 'terminated',
          terminated_at: new Date().toISOString(),
          termination_reason: reason,
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['active-contract'] });
      toast.success('Contract terminated');
    },
    onError: (error) => {
      toast.error('Failed to terminate contract', { description: error.message });
    },
  });
}
