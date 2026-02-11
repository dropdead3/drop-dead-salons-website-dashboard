import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CardActionItem {
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueInDays: number;
  details: string;
}

interface CardInsightData {
  insight: string;
  actionItems: CardActionItem[];
}

interface UseCardInsightOptions {
  cardName: string;
  metricData?: Record<string, string | number>;
  dateRange?: string;
  locationName?: string;
}

export function useCardInsight({ cardName, metricData, dateRange, locationName }: UseCardInsightOptions) {
  const [data, setData] = useState<CardInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const cacheKey = `card-insight-${cardName}-${dateRange}-${JSON.stringify(metricData)}`;

  const fetchInsight = useCallback(async () => {
    const cached = queryClient.getQueryData<CardInsightData>([cacheKey]);
    if (cached) {
      setData(cached);
      return;
    }

    setIsLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('ai-card-analysis', {
        body: { cardName, metricData, dateRange, locationName },
      });

      if (error) throw error;

      if (responseData?.error) {
        toast.error(responseData.error);
        return;
      }

      const result: CardInsightData = {
        insight: responseData?.insight || 'Unable to generate analysis.',
        actionItems: Array.isArray(responseData?.actionItems) ? responseData.actionItems : [],
      };

      setData(result);
      queryClient.setQueryData([cacheKey], result, {});
      setTimeout(() => queryClient.removeQueries({ queryKey: [cacheKey] }), 10 * 60 * 1000);
    } catch (err) {
      console.error('Card insight error:', err);
      toast.error('Failed to load AI analysis');
    } finally {
      setIsLoading(false);
    }
  }, [cardName, metricData, dateRange, locationName, cacheKey, queryClient]);

  return {
    insight: data?.insight || null,
    actionItems: data?.actionItems || [],
    isLoading,
    fetchInsight,
    clearInsight: () => setData(null),
  };
}
