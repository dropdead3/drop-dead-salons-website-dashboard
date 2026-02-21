import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AddonMarginItem {
  name: string;
  marginPct: number;
  price: number;
  cost: number;
}

export interface AddonMarginData {
  avgMarginPct: number;
  addonsWithCost: number;
  totalAddons: number;
  topMargin: AddonMarginItem[];
  lowMargin: AddonMarginItem[];
}

export function useAddonMarginAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: ['addon-margin-analytics', organizationId],
    queryFn: async (): Promise<AddonMarginData> => {
      const { data, error } = await supabase
        .from('service_addons')
        .select('name, price, cost')
        .eq('organization_id', organizationId!)
        .eq('is_active', true);

      if (error) throw error;

      const allAddons = data || [];
      const withCost = allAddons.filter(
        (a) => a.cost !== null && a.cost !== undefined && a.price > 0
      );

      if (withCost.length === 0) {
        return {
          avgMarginPct: 0,
          addonsWithCost: 0,
          totalAddons: allAddons.length,
          topMargin: [],
          lowMargin: [],
        };
      }

      const margins = withCost.map((a) => ({
        name: a.name,
        price: a.price,
        cost: a.cost!,
        marginPct: ((a.price - a.cost!) / a.price) * 100,
      }));

      margins.sort((a, b) => b.marginPct - a.marginPct);

      const avgMarginPct =
        margins.reduce((s, m) => s + m.marginPct, 0) / margins.length;

      return {
        avgMarginPct,
        addonsWithCost: withCost.length,
        totalAddons: allAddons.length,
        topMargin: margins.slice(0, 3),
        lowMargin: margins.slice(-1),
      };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}
