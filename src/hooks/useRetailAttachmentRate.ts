import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RetailAttachmentData {
  /** Total distinct transactions containing at least one service */
  serviceTransactions: number;
  /** Distinct service transactions that also included a retail product */
  attachedTransactions: number;
  /** attachedTransactions / serviceTransactions × 100 */
  attachmentRate: number;
}

interface UseRetailAttachmentRateOptions {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
}

export function useRetailAttachmentRate({ dateFrom, dateTo, locationId }: UseRetailAttachmentRateOptions) {
  return useQuery({
    queryKey: ['retail-attachment-rate', dateFrom, dateTo, locationId || 'all'],
    queryFn: async (): Promise<RetailAttachmentData> => {
      let serviceQuery = supabase
        .from('phorest_transaction_items')
        .select('transaction_id')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .not('transaction_id', 'is', null)
        .in('item_type', ['Service', 'service', 'SERVICE']);

      let productQuery = supabase
        .from('phorest_transaction_items')
        .select('transaction_id')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .not('transaction_id', 'is', null)
        .in('item_type', ['Product', 'product', 'PRODUCT', 'Retail', 'retail', 'RETAIL']);

      if (locationId && locationId !== 'all') {
        serviceQuery = serviceQuery.eq('location_id', locationId);
        productQuery = productQuery.eq('location_id', locationId);
      }

      const [serviceResult, productResult] = await Promise.all([
        serviceQuery,
        productQuery,
      ]);

      if (serviceResult.error) throw serviceResult.error;
      if (productResult.error) throw productResult.error;

      // Distinct service transactions
      const serviceTxSet = new Set<string>();
      (serviceResult.data || []).forEach(row => {
        if (row.transaction_id) serviceTxSet.add(row.transaction_id);
      });

      // Distinct product transactions
      const productTxSet = new Set<string>();
      (productResult.data || []).forEach(row => {
        if (row.transaction_id) productTxSet.add(row.transaction_id);
      });

      // Attachment = service transactions that also appear in product transactions
      const serviceTransactions = serviceTxSet.size;
      let attachedTransactions = 0;
      serviceTxSet.forEach(txId => {
        if (productTxSet.has(txId)) attachedTransactions++;
      });

      const attachmentRate = serviceTransactions > 0
        ? Math.round((attachedTransactions / serviceTransactions) * 100)
        : 0;

      return { serviceTransactions, attachedTransactions, attachmentRate };
    },
    staleTime: 5 * 60 * 1000,
  });
}
