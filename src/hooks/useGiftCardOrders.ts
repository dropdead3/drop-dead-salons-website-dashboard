import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GiftCardOrder {
  id: string;
  organization_id: string;
  quantity: number;
  card_design: string;
  card_stock: 'standard' | 'premium' | 'plastic';
  custom_logo_url: string | null;
  custom_message: string | null;
  card_number_prefix: string | null;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shipping_method: 'standard' | 'express' | 'overnight';
  status: 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';
  unit_price: number;
  total_price: number;
  tracking_number: string | null;
  estimated_delivery: string | null;
  ordered_by: string;
  ordered_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
}

export const CARD_STOCK_PRICING = {
  standard: 0.50,
  premium: 0.85,
  plastic: 1.50,
} as const;

export const SHIPPING_PRICING = {
  standard: 0,
  express: 15,
  overnight: 35,
} as const;

export function useGiftCardOrders(organizationId?: string) {
  return useQuery({
    queryKey: ['gift-card-orders', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_card_orders' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('ordered_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as GiftCardOrder[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateGiftCardOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<GiftCardOrder, 'id' | 'ordered_at' | 'shipped_at' | 'delivered_at' | 'status' | 'tracking_number' | 'estimated_delivery'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const unitPrice = CARD_STOCK_PRICING[order.card_stock];
      const shippingPrice = SHIPPING_PRICING[order.shipping_method];
      const totalPrice = (order.quantity * unitPrice) + shippingPrice;

      const { data, error } = await supabase
        .from('gift_card_orders' as any)
        .insert({
          ...order,
          unit_price: unitPrice,
          total_price: totalPrice,
          ordered_by: user?.id,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as GiftCardOrder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gift-card-orders', variables.organization_id] });
      toast.success('Order submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit order: ' + error.message);
    },
  });
}
