import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getServiceCategory } from '@/utils/serviceCategorization';

export interface ServiceRetailRow {
  serviceName: string;
  serviceCategory: string | null;
  totalTransactions: number;
  attachedTransactions: number;
  attachmentRate: number;
  retailRevenue: number;
  avgRetailPerAttached: number;
}

interface UseServiceRetailAttachmentOptions {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
}

const PAGE_SIZE = 1000;

async function fetchAllPages(
  buildQuery: (offset: number) => any
): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await buildQuery(offset);
    if (error) throw error;
    all.push(...(data || []));
    hasMore = (data?.length || 0) === PAGE_SIZE;
    offset += PAGE_SIZE;
  }
  return all;
}

export function useServiceRetailAttachment({ dateFrom, dateTo, locationId }: UseServiceRetailAttachmentOptions) {
  return useQuery({
    queryKey: ['service-retail-attachment', dateFrom, dateTo, locationId || 'all'],
    queryFn: async (): Promise<ServiceRetailRow[]> => {
      // 1. Fetch all service items in date range
      const serviceItems = await fetchAllPages((offset) => {
        let q = supabase
          .from('phorest_transaction_items')
          .select('transaction_id, item_name, item_category')
          .gte('transaction_date', dateFrom)
          .lte('transaction_date', dateTo)
          .not('transaction_id', 'is', null)
          .in('item_type', ['Service', 'service', 'SERVICE'])
          .range(offset, offset + PAGE_SIZE - 1);
        if (locationId && locationId !== 'all') q = q.eq('location_id', locationId);
        return q;
      });

      // 2. Fetch all product items in date range
      const productItems = await fetchAllPages((offset) => {
        let q = supabase
          .from('phorest_transaction_items')
          .select('transaction_id, total_amount')
          .gte('transaction_date', dateFrom)
          .lte('transaction_date', dateTo)
          .not('transaction_id', 'is', null)
          .in('item_type', ['Product', 'product', 'PRODUCT', 'Retail', 'retail', 'RETAIL'])
          .range(offset, offset + PAGE_SIZE - 1);
        if (locationId && locationId !== 'all') q = q.eq('location_id', locationId);
        return q;
      });

      // 3. Build product transaction map: txId -> total retail $
      const productTxMap = new Map<string, number>();
      for (const p of productItems) {
        if (!p.transaction_id) continue;
        productTxMap.set(
          p.transaction_id,
          (productTxMap.get(p.transaction_id) || 0) + (Number(p.total_amount) || 0)
        );
      }

      // 4. Group services by item_name
      const serviceMap = new Map<string, {
        category: string | null;
        txIds: Set<string>;
      }>();

      for (const s of serviceItems) {
        if (!s.transaction_id || !s.item_name) continue;
        const key = s.item_name;
        let entry = serviceMap.get(key);
        if (!entry) {
          entry = {
            category: s.item_category || getServiceCategory(s.item_name),
            txIds: new Set(),
          };
          serviceMap.set(key, entry);
        }
        entry.txIds.add(s.transaction_id);
      }

      // 5. Calculate attachment metrics per service
      const rows: ServiceRetailRow[] = [];
      for (const [serviceName, { category, txIds }] of serviceMap) {
        const totalTransactions = txIds.size;
        let attachedTransactions = 0;
        let retailRevenue = 0;

        txIds.forEach(txId => {
          const retailAmount = productTxMap.get(txId);
          if (retailAmount !== undefined && retailAmount > 0) {
            attachedTransactions++;
            retailRevenue += retailAmount;
          }
        });

        const attachmentRate = totalTransactions > 0
          ? Math.round((attachedTransactions / totalTransactions) * 100)
          : 0;
        const avgRetailPerAttached = attachedTransactions > 0
          ? retailRevenue / attachedTransactions
          : 0;

        rows.push({
          serviceName,
          serviceCategory: category,
          totalTransactions,
          attachedTransactions,
          attachmentRate,
          retailRevenue,
          avgRetailPerAttached,
        });
      }

      // Sort by retail revenue descending
      rows.sort((a, b) => b.retailRevenue - a.retailRevenue);
      return rows;
    },
    staleTime: 5 * 60 * 1000,
  });
}
