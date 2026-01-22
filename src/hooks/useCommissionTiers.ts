import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommissionTier {
  id: string;
  tier_name: string;
  min_revenue: number;
  max_revenue: number | null;
  commission_rate: number;
  applies_to: 'all' | 'services' | 'products';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCommissionTiers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['commission-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('is_active', true)
        .order('applies_to', { ascending: true })
        .order('min_revenue', { ascending: true });

      if (error) throw error;
      return data as CommissionTier[];
    },
  });

  const updateTier = useMutation({
    mutationFn: async (tier: Partial<CommissionTier> & { id: string }) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .update({
          ...tier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tier.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
      toast({ title: 'Commission tier updated' });
    },
  });

  const createTier = useMutation({
    mutationFn: async (tier: Omit<CommissionTier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .insert(tier)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
      toast({ title: 'Commission tier created' });
    },
  });

  // Calculate commission based on revenue
  const calculateCommission = (serviceRevenue: number, productRevenue: number) => {
    if (!query.data) return { serviceCommission: 0, productCommission: 0, totalCommission: 0, tierName: '' };

    const serviceTiers = query.data.filter(t => t.applies_to === 'services' || t.applies_to === 'all');
    const productTiers = query.data.filter(t => t.applies_to === 'products' || t.applies_to === 'all');

    // Find applicable service tier
    let serviceCommission = 0;
    let tierName = '';
    for (const tier of serviceTiers) {
      const max = tier.max_revenue ?? Infinity;
      if (serviceRevenue >= tier.min_revenue && serviceRevenue <= max) {
        serviceCommission = serviceRevenue * tier.commission_rate;
        tierName = tier.tier_name;
        break;
      }
    }

    // Find applicable product tier
    let productCommission = 0;
    for (const tier of productTiers) {
      const max = tier.max_revenue ?? Infinity;
      if (productRevenue >= 0 && productRevenue <= max) {
        productCommission = productRevenue * tier.commission_rate;
        break;
      }
    }

    return {
      serviceCommission,
      productCommission,
      totalCommission: serviceCommission + productCommission,
      tierName,
    };
  };

  return {
    tiers: query.data || [],
    isLoading: query.isLoading,
    updateTier: updateTier.mutate,
    createTier: createTier.mutate,
    calculateCommission,
  };
}
