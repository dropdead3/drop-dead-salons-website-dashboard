import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';

export interface SchedulingSuggestion {
  time: string;
  endTime: string;
  staffUserId: string;
  staffName: string;
  score: number;
  reason: string;
  suggestionType: 'optimal_slot' | 'fill_gap' | 'avoid_conflict' | 'peak_time';
}

export interface SchedulingSuggestionsResponse {
  success: boolean;
  date: string;
  serviceDuration: number;
  suggestions: SchedulingSuggestion[];
  existingCount: number;
}

interface FetchSuggestionsParams {
  date: Date;
  locationId?: string;
  serviceDurationMinutes?: number;
  staffUserId?: string;
}

export function useSchedulingSuggestions({
  date,
  locationId,
  serviceDurationMinutes = 60,
  staffUserId,
}: FetchSuggestionsParams) {
  const { effectiveOrganization } = useOrganizationContext();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['scheduling-suggestions', dateStr, locationId, serviceDurationMinutes, staffUserId],
    queryFn: async (): Promise<SchedulingSuggestionsResponse> => {
      if (!effectiveOrganization?.id) {
        throw new Error('No organization context');
      }

      const { data, error } = await supabase.functions.invoke('ai-scheduling-copilot', {
        body: {
          date: dateStr,
          locationId,
          serviceDurationMinutes,
          staffUserId,
          organizationId: effectiveOrganization.id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to get suggestions');

      return data;
    },
    enabled: !!effectiveOrganization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useAcceptSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      suggestionId, 
      accepted 
    }: { 
      suggestionId: string; 
      accepted: boolean;
    }) => {
      const { error } = await supabase
        .from('scheduling_suggestions')
        .update({ was_accepted: accepted })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-suggestions'] });
    },
  });
}

export function useSuggestionHistory(days = 30) {
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['suggestion-history', effectiveOrganization?.id, days],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return { accepted: 0, total: 0, rate: 0 };

      const startDate = format(
        new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );

      const { data, error } = await supabase
        .from('scheduling_suggestions')
        .select('id, was_accepted')
        .eq('organization_id', effectiveOrganization.id)
        .gte('created_at', startDate);

      if (error) throw error;

      const total = data?.length || 0;
      const accepted = data?.filter(s => s.was_accepted === true).length || 0;
      const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      return { accepted, total, rate };
    },
    enabled: !!effectiveOrganization?.id,
  });
}
