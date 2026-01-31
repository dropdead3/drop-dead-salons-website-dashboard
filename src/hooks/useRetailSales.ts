import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem, RegisterCartState } from './useRegisterCart';

export interface RetailSale {
  id: string;
  organization_id: string;
  location_id: string | null;
  client_id: string | null;
  staff_id: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string | null;
  payment_status: string | null;
  applied_credit: number | null;
  notes: string | null;
  created_at: string;
}

export interface RetailSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total_amount: number;
  created_at: string;
}

interface CreateSaleParams {
  organizationId: string;
  locationId: string;
  cart: RegisterCartState;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

export function useCreateRetailSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      locationId, 
      cart, 
      items, 
      subtotal, 
      taxAmount, 
      total,
      notes 
    }: CreateSaleParams) => {
      // Create the sale record using raw query since types may not be updated yet
      const { data: sale, error: saleError } = await supabase
        .from('retail_sales' as any)
        .insert({
          organization_id: organizationId,
          location_id: locationId,
          client_id: cart.clientId,
          staff_id: cart.staffId,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: cart.discountAmount,
          total_amount: total,
          payment_method: cart.paymentMethod,
          payment_status: 'completed',
          applied_credit: cart.appliedCredit,
          notes,
        } as any)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create the sale items
      const saleItems = items.map((item) => ({
        sale_id: (sale as any).id,
        product_id: item.productId,
        product_name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        total_amount: item.unitPrice * item.quantity - item.discount,
      }));

      const { error: itemsError } = await supabase
        .from('retail_sale_items' as any)
        .insert(saleItems as any);

      if (itemsError) throw itemsError;

      // If credit was applied, deduct from client balance
      if (cart.appliedCredit > 0 && cart.clientId) {
        const { error: balanceError } = await supabase.rpc('add_to_client_balance', {
          p_organization_id: organizationId,
          p_client_id: cart.clientId,
          p_amount: -cart.appliedCredit,
          p_balance_type: 'salon_credit',
          p_transaction_type: 'credit_redemption',
          p_reference_transaction_id: (sale as any).id,
          p_notes: 'Applied to retail purchase',
        });

        if (balanceError) {
          console.error('Failed to deduct credit balance:', balanceError);
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-sales'] });
      queryClient.invalidateQueries({ queryKey: ['client-balances'] });
      toast.success('Sale completed successfully');
    },
    onError: (error) => {
      toast.error('Failed to complete sale: ' + error.message);
    },
  });
}

export function useRetailSales(filters: { locationId?: string; startDate?: string; endDate?: string } = {}) {
  return useQuery({
    queryKey: ['retail-sales', filters],
    queryFn: async () => {
      let query = supabase
        .from('retail_sales' as any)
        .select(`
          *,
          items:retail_sale_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.locationId && filters.locationId !== 'all') {
        query = query.eq('location_id', filters.locationId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as RetailSale[];
    },
  });
}
