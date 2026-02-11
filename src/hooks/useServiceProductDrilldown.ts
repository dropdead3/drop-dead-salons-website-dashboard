import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffServiceProduct {
  phorestStaffId: string;
  staffName: string;
  serviceRevenue: number;
  serviceCount: number;
  productRevenue: number;
  productCount: number;
  retailToServiceRatio: number; // percentage
  sharePercent: number; // share of total in the active mode
}

interface UseServiceProductDrilldownOptions {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
}

export function useServiceProductDrilldown({ dateFrom, dateTo, locationId }: UseServiceProductDrilldownOptions) {
  return useQuery({
    queryKey: ['service-product-drilldown', dateFrom, dateTo, locationId || 'all'],
    queryFn: async () => {
      // Fetch transaction items in range
      let query = supabase
        .from('phorest_transaction_items')
        .select('phorest_staff_id, item_type, total_amount, quantity')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .in('item_type', ['Service', 'Product']);

      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      const { data: items, error } = await query;
      if (error) throw error;

      // Fetch staff name mappings
      const { data: staffMappings } = await supabase
        .from('phorest_staff_mapping')
        .select(`
          phorest_staff_id,
          user_id,
          employee_profiles:user_id (
            full_name,
            display_name
          )
        `)
        .eq('is_active', true);

      const staffLookup: Record<string, string> = {};
      staffMappings?.forEach(m => {
        const profile = m.employee_profiles as any;
        staffLookup[m.phorest_staff_id] = profile?.display_name || profile?.full_name || 'Unknown';
      });

      // Aggregate by staff
      const staffMap: Record<string, {
        serviceRevenue: number;
        serviceCount: number;
        productRevenue: number;
        productCount: number;
      }> = {};

      (items || []).forEach(item => {
        const sid = item.phorest_staff_id;
        if (!sid) return;
        if (!staffMap[sid]) {
          staffMap[sid] = { serviceRevenue: 0, serviceCount: 0, productRevenue: 0, productCount: 0 };
        }
        const amount = Number(item.total_amount) || 0;
        const qty = Number(item.quantity) || 1;
        if (item.item_type === 'Service') {
          staffMap[sid].serviceRevenue += amount;
          staffMap[sid].serviceCount += qty;
        } else {
          staffMap[sid].productRevenue += amount;
          staffMap[sid].productCount += qty;
        }
      });

      // Compute totals
      let totalServiceRevenue = 0;
      let totalProductRevenue = 0;
      Object.values(staffMap).forEach(v => {
        totalServiceRevenue += v.serviceRevenue;
        totalProductRevenue += v.productRevenue;
      });

      const staffData: StaffServiceProduct[] = Object.entries(staffMap)
        .map(([phorestStaffId, v]) => ({
          phorestStaffId,
          staffName: staffLookup[phorestStaffId] || 'Unknown',
          ...v,
          retailToServiceRatio: v.serviceRevenue > 0
            ? Math.round((v.productRevenue / v.serviceRevenue) * 100)
            : 0,
          sharePercent: 0, // computed per-mode by component
        }));

      return {
        staffData,
        totalServiceRevenue,
        totalProductRevenue,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
