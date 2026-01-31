import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Voucher {
  id: string;
  organization_id: string;
  promotion_id: string | null;
  code: string;
  voucher_type: 'discount' | 'free_service' | 'credit' | 'upgrade';
  value: number | null;
  value_type: 'fixed' | 'percentage';
  free_service_id: string | null;
  issued_to_client_id: string | null;
  issued_to_email: string | null;
  issued_to_name: string | null;
  is_redeemed: boolean;
  redeemed_at: string | null;
  redeemed_by_client_id: string | null;
  redeemed_transaction_id: string | null;
  valid_from: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  issued_by: string | null;
  issued_at: string;
}

export type VoucherInsert = Omit<Voucher, 'id' | 'issued_at' | 'is_redeemed' | 'redeemed_at' | 'redeemed_by_client_id' | 'redeemed_transaction_id'>;

// Generate a unique voucher code
export function generateVoucherCode(prefix: string = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${code}` : code;
}

export function useVouchers(organizationId?: string) {
  return useQuery({
    queryKey: ['vouchers', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('vouchers' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Voucher[];
    },
    enabled: !!organizationId,
  });
}

export function useActiveVouchers(organizationId?: string) {
  return useQuery({
    queryKey: ['vouchers', 'active', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('vouchers' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_redeemed', false)
        .lte('valid_from', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Voucher[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucher: VoucherInsert) => {
      const { data, error } = await supabase
        .from('vouchers' as any)
        .insert(voucher as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers', variables.organization_id] });
      toast.success('Voucher created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create voucher: ' + error.message);
    },
  });
}

export function useCreateBulkVouchers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      count, 
      prefix, 
      voucherTemplate 
    }: { 
      organizationId: string; 
      count: number; 
      prefix: string; 
      voucherTemplate: Omit<VoucherInsert, 'organization_id' | 'code'> 
    }) => {
      const vouchers = Array.from({ length: count }, () => ({
        ...voucherTemplate,
        organization_id: organizationId,
        code: generateVoucherCode(prefix),
      }));

      const { data, error } = await supabase
        .from('vouchers' as any)
        .insert(vouchers as any)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers', variables.organizationId] });
      toast.success(`${data?.length || 0} vouchers created`);
    },
    onError: (error) => {
      toast.error('Failed to create vouchers: ' + error.message);
    },
  });
}

export function useRedeemVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      voucherId, 
      clientId, 
      transactionId 
    }: { 
      voucherId: string; 
      clientId: string; 
      transactionId: string;
    }) => {
      const { data, error } = await supabase
        .from('vouchers' as any)
        .update({
          is_redeemed: true,
          redeemed_at: new Date().toISOString(),
          redeemed_by_client_id: clientId,
          redeemed_transaction_id: transactionId,
        } as any)
        .eq('id', voucherId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers', data.organization_id] });
      toast.success('Voucher redeemed');
    },
    onError: (error) => {
      toast.error('Failed to redeem voucher: ' + error.message);
    },
  });
}

export function useValidateVoucherCode(organizationId?: string) {
  return useMutation({
    mutationFn: async (code: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('vouchers' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .eq('is_redeemed', false)
        .lte('valid_from', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Invalid, expired, or already used voucher');
        }
        throw error;
      }
      
      return data as unknown as Voucher;
    },
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('vouchers' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers', variables.organizationId] });
      toast.success('Voucher deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete voucher: ' + error.message);
    },
  });
}
