import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RetailAttachmentData {
  /** Total distinct clients who had at least one service */
  serviceClients: number;
  /** Distinct clients who had both a service AND a product purchase */
  retailClients: number;
  /** retailClients / serviceClients × 100 */
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
      // Build base filter
      let serviceQuery = supabase
        .from('phorest_transaction_items')
        .select('phorest_client_id')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .not('phorest_client_id', 'is', null)
        .in('item_type', ['Service', 'service', 'SERVICE']);

      let productQuery = supabase
        .from('phorest_transaction_items')
        .select('phorest_client_id')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .not('phorest_client_id', 'is', null)
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

      // Get distinct service clients
      const serviceClientSet = new Set<string>();
      (serviceResult.data || []).forEach(row => {
        if (row.phorest_client_id) serviceClientSet.add(row.phorest_client_id);
      });

      // Get distinct product clients
      const productClientSet = new Set<string>();
      (productResult.data || []).forEach(row => {
        if (row.phorest_client_id) productClientSet.add(row.phorest_client_id);
      });

      // Attachment = service clients who also appear in product clients
      const serviceClients = serviceClientSet.size;
      let retailClients = 0;
      serviceClientSet.forEach(clientId => {
        if (productClientSet.has(clientId)) retailClients++;
      });

      const attachmentRate = serviceClients > 0
        ? Math.round((retailClients / serviceClients) * 100)
        : 0;

      return { serviceClients, retailClients, attachmentRate };
    },
    staleTime: 5 * 60 * 1000,
  });
}
