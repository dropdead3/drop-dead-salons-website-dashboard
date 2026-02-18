import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';
import { format, startOfMonth, startOfWeek } from 'date-fns';

export interface RetailGoal {
  id: string;
  organization_id: string;
  location_id: string | null;
  target_revenue: number;
  target_attachment_rate: number | null;
  goal_period: 'monthly' | 'weekly';
  period_start: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RetailGoalProgress {
  goal: RetailGoal;
  currentRevenue: number;
  currentAttachmentRate: number;
  progressPct: number;
  attachmentProgressPct: number;
  daysElapsed: number;
  daysRemaining: number;
  requiredDailyRate: number;
  onTrack: boolean;
}

export function useRetailGoals(period: 'monthly' | 'weekly' = 'monthly') {
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['retail-goals', orgId, period],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('retail_sales_goals' as any)
        .select('*')
        .eq('organization_id', orgId)
        .eq('goal_period', period)
        .order('period_start', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as RetailGoal[];
    },
    enabled: !!orgId,
  });
}

export function useCurrentRetailGoals() {
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['retail-goals-current', orgId, monthStart, weekStart],
    queryFn: async () => {
      if (!orgId) return { monthly: [], weekly: [] };
      const [{ data: monthly }, { data: weekly }] = await Promise.all([
        supabase.from('retail_sales_goals' as any).select('*').eq('organization_id', orgId).eq('goal_period', 'monthly').eq('period_start', monthStart),
        supabase.from('retail_sales_goals' as any).select('*').eq('organization_id', orgId).eq('goal_period', 'weekly').eq('period_start', weekStart),
      ]);
      return {
        monthly: (monthly || []) as unknown as RetailGoal[],
        weekly: (weekly || []) as unknown as RetailGoal[],
      };
    },
    enabled: !!orgId,
  });
}

export function useSaveRetailGoal() {
  const queryClient = useQueryClient();
  const { data: profile } = useEmployeeProfile();
  const orgId = profile?.organization_id;

  return useMutation({
    mutationFn: async (goal: { locationId?: string | null; targetRevenue: number; targetAttachmentRate?: number | null; goalPeriod: 'monthly' | 'weekly'; periodStart: string }) => {
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('retail_sales_goals' as any)
        .upsert({
          organization_id: orgId,
          location_id: goal.locationId || null,
          target_revenue: goal.targetRevenue,
          target_attachment_rate: goal.targetAttachmentRate || null,
          goal_period: goal.goalPeriod,
          period_start: goal.periodStart,
        } as any, { onConflict: 'organization_id,location_id,goal_period,period_start' as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-goals'] });
      queryClient.invalidateQueries({ queryKey: ['retail-goals-current'] });
      toast.success('Retail goal saved');
    },
    onError: (e) => toast.error('Failed to save goal: ' + e.message),
  });
}
