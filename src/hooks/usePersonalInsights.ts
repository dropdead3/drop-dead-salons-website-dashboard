import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AIInsightsData } from './useAIInsights';

interface PersonalInsightsRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  insights: AIInsightsData;
  role_tier: string;
  generated_at: string;
  expires_at: string;
  created_at: string;
}

const STALE_TIME = 2 * 60 * 60 * 1000; // 2 hours
const COOLDOWN_MS = 60 * 1000;

export function usePersonalInsights() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-personal-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('ai_personal_insights' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const row = (data as any)?.[0] as PersonalInsightsRow | undefined;
      return row || null;
    },
    enabled: !!user,
    staleTime: STALE_TIME,
  });

  const isStale = !data || new Date(data.expires_at) <= new Date();

  const refresh = useCallback(async (force = false) => {
    if (!user) return;

    const now = Date.now();
    if (!force && now - lastRefreshTime < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastRefreshTime)) / 1000);
      toast.info(`Please wait ${remainingSec}s before refreshing again`);
      return;
    }

    setIsRefreshing(true);
    setLastRefreshTime(now);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-personal-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ forceRefresh: true }),
        }
      );

      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please try again later.');
        return;
      }
      if (response.status === 402) {
        toast.error('AI credits exhausted.');
        return;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate insights');
      }

      queryClient.invalidateQueries({ queryKey: ['ai-personal-insights', user.id] });
      toast.success('Personal insights refreshed');
    } catch (err) {
      console.error('Failed to refresh personal insights:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to refresh insights');
    } finally {
      setIsRefreshing(false);
    }
  }, [user, lastRefreshTime, queryClient]);

  const cooldownRemaining = Math.max(0, COOLDOWN_MS - (Date.now() - lastRefreshTime));

  return {
    data: data?.insights as AIInsightsData | undefined,
    generatedAt: data?.generated_at,
    expiresAt: data?.expires_at,
    roleTier: data?.role_tier,
    isLoading,
    isRefreshing,
    isStale,
    error,
    refresh,
    cooldownRemaining,
  };
}
