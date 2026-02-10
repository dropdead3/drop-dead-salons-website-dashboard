import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseCardInsightOptions {
  cardName: string;
  metricData?: Record<string, string | number>;
  dateRange?: string;
  locationName?: string;
}

export function useCardInsight({ cardName, metricData, dateRange, locationName }: UseCardInsightOptions) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const cacheKey = `card-insight-${cardName}-${dateRange}-${JSON.stringify(metricData)}`;

  const fetchInsight = useCallback(async () => {
    // Check cache first
    const cached = queryClient.getQueryData<string>([cacheKey]);
    if (cached) {
      setInsight(cached);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-card-analysis', {
        body: { cardName, metricData, dateRange, locationName },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data?.insight || 'Unable to generate analysis.';
      setInsight(result);
      // Cache for 10 minutes
      queryClient.setQueryData([cacheKey], result, {});
      setTimeout(() => queryClient.removeQueries({ queryKey: [cacheKey] }), 10 * 60 * 1000);
    } catch (err) {
      console.error('Card insight error:', err);
      toast.error('Failed to load AI analysis');
    } finally {
      setIsLoading(false);
    }
  }, [cardName, metricData, dateRange, locationName, cacheKey, queryClient]);

  return { insight, isLoading, fetchInsight, clearInsight: () => setInsight(null) };
}
