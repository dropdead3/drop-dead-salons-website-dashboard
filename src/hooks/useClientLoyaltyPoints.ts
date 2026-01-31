import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientLoyaltyPoints {
  id: string;
  organization_id: string;
  client_id: string;
  current_points: number;
  lifetime_points: number;
  tier: string;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  organization_id: string;
  client_id: string;
  transaction_type: 'earned' | 'redeemed' | 'bonus' | 'expired' | 'adjustment';
  points: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export function useClientLoyaltyPoints(clientId?: string) {
  return useQuery({
    queryKey: ['client-loyalty-points', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_loyalty_points' as any)
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as ClientLoyaltyPoints | null;
    },
    enabled: !!clientId,
  });
}

export function useClientPointsHistory(clientId?: string) {
  return useQuery({
    queryKey: ['client-points-history', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_transactions' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as PointsTransaction[];
    },
    enabled: !!clientId,
  });
}

export function useAddLoyaltyPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      clientId,
      points,
      transactionType,
      referenceType,
      referenceId,
      description,
    }: {
      organizationId: string;
      clientId: string;
      points: number;
      transactionType: 'earned' | 'redeemed' | 'bonus' | 'adjustment';
      referenceType?: string;
      referenceId?: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // First, ensure client has a loyalty points record
      const { data: existingData } = await supabase
        .from('client_loyalty_points' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .maybeSingle();

      const existing = existingData as unknown as ClientLoyaltyPoints | null;
      const currentPoints = (existing?.current_points || 0) + points;
      const lifetimePoints = points > 0 
        ? (existing?.lifetime_points || 0) + points 
        : (existing?.lifetime_points || 0);

      if (existing) {
        await supabase
          .from('client_loyalty_points' as any)
          .update({
            current_points: currentPoints,
            lifetime_points: lifetimePoints,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('client_loyalty_points' as any)
          .insert({
            organization_id: organizationId,
            client_id: clientId,
            current_points: currentPoints,
            lifetime_points: lifetimePoints,
          } as any);
      }

      // Log the transaction
      const { error: txError } = await supabase
        .from('points_transactions' as any)
        .insert({
          organization_id: organizationId,
          client_id: clientId,
          transaction_type: transactionType,
          points,
          reference_type: referenceType,
          reference_id: referenceId,
          description,
          created_by: user?.id,
        } as any);

      if (txError) throw txError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-loyalty-points', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-points-history', variables.clientId] });
      toast.success('Points updated');
    },
    onError: (error) => {
      toast.error('Failed to update points: ' + error.message);
    },
  });
}
