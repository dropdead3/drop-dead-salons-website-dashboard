import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';

export interface ReorderQueueItem {
  id: string;
  organization_id: string;
  product_id: string;
  suggested_quantity: number;
  reason: string | null;
  status: 'pending' | 'ordered' | 'received' | 'dismissed';
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined product data
  product?: {
    name: string;
    brand: string | null;
    category: string | null;
    sku: string | null;
    retail_price: number | null;
    cost_price: number | null;
    quantity_on_hand: number | null;
    reorder_level: number | null;
  };
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  brand: string | null;
  category: string | null;
  currentStock: number;
  reorderLevel: number;
  deficit: number;
  suggestedReorder: number;
  salesVelocity: number; // units per day
  daysUntilStockout: number;
  severity: 'critical' | 'warning' | 'info';
}

export function useReorderQueue(status: string = 'pending') {
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['reorder-queue', orgId, status],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('inventory_reorder_queue' as any)
        .select('*, product:products(*)')
        .eq('organization_id', orgId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ReorderQueueItem[];
    },
    enabled: !!orgId,
  });
}

export function useUpdateReorderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'ordered') updates.ordered_at = new Date().toISOString();
      if (status === 'received') updates.received_at = new Date().toISOString();
      const { error } = await supabase
        .from('inventory_reorder_queue' as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-queue'] });
      toast.success('Reorder status updated');
    },
    onError: (e) => toast.error('Failed to update: ' + e.message),
  });
}

export function useGenerateReorderSuggestions() {
  const queryClient = useQueryClient();
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useMutation({
    mutationFn: async (salesVelocityMap: Map<string, number>) => {
      if (!orgId) throw new Error('No organization');

      // Get all active products below reorder level
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, brand, category, quantity_on_hand, reorder_level, retail_price')
        .eq('is_active', true)
        .not('reorder_level', 'is', null);

      if (error) throw error;

      const lowStock = (products || []).filter((p: any) =>
        p.quantity_on_hand != null && p.reorder_level != null && p.quantity_on_hand <= p.reorder_level
      );

      if (lowStock.length === 0) {
        toast.info('No products below reorder level');
        return;
      }

      // Build reorder suggestions
      const suggestions = lowStock.map((p: any) => {
        const velocity = salesVelocityMap.get(p.name?.toLowerCase()) || 0;
        const deficit = Math.max(0, (p.reorder_level || 0) - (p.quantity_on_hand || 0));
        // Suggest enough stock for 30 days based on velocity, minimum = deficit
        const velocityOrder = Math.ceil(velocity * 30);
        const suggestedQty = Math.max(deficit, velocityOrder);

        return {
          organization_id: orgId,
          product_id: p.id,
          suggested_quantity: suggestedQty,
          reason: velocity > 0
            ? `Below reorder level (${p.quantity_on_hand}/${p.reorder_level}). Selling ${velocity.toFixed(1)} units/day.`
            : `Below reorder level (${p.quantity_on_hand}/${p.reorder_level}).`,
          status: 'pending',
        };
      });

      // Upsert (skip existing pending items for same product)
      for (const s of suggestions) {
        await supabase
          .from('inventory_reorder_queue' as any)
          .upsert(s as any, { onConflict: 'organization_id,product_id,status' as any });
      }

      return suggestions.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['reorder-queue'] });
      if (count) toast.success(`${count} reorder suggestion(s) generated`);
    },
    onError: (e) => toast.error('Failed to generate suggestions: ' + e.message),
  });
}

/** Calculate inventory alerts from products + sales velocity */
export function calculateInventoryAlerts(
  products: { id: string; name: string; brand: string | null; category: string | null; quantity_on_hand: number | null; reorder_level: number | null }[],
  salesVelocityMap: Map<string, number>,
): InventoryAlert[] {
  return products
    .filter(p => p.reorder_level != null && p.quantity_on_hand != null && p.quantity_on_hand <= p.reorder_level)
    .map(p => {
      const velocity = salesVelocityMap.get(p.name.toLowerCase()) || 0;
      const deficit = Math.max(0, (p.reorder_level || 0) - (p.quantity_on_hand || 0));
      const daysUntilStockout = velocity > 0 ? Math.floor((p.quantity_on_hand || 0) / velocity) : 999;
      const suggestedReorder = Math.max(deficit, Math.ceil(velocity * 30));
      const severity: InventoryAlert['severity'] =
        (p.quantity_on_hand || 0) === 0 ? 'critical' :
        daysUntilStockout <= 7 ? 'critical' :
        daysUntilStockout <= 14 ? 'warning' : 'info';

      return {
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category,
        currentStock: p.quantity_on_hand || 0,
        reorderLevel: p.reorder_level || 0,
        deficit,
        suggestedReorder,
        salesVelocity: velocity,
        daysUntilStockout,
        severity,
      };
    })
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}
