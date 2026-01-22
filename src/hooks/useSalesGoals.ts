import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesGoal {
  id: string;
  location_id: string | null;
  target_revenue: number;
  goal_period: 'monthly' | 'weekly';
  period_start: string;
  created_at: string;
  updated_at: string;
}

// For now, we'll use a simple local storage approach since we don't have a goals table
// This can be upgraded to a database table later
const STORAGE_KEY = 'sales-goals';

interface StoredGoals {
  monthlyTarget: number;
  weeklyTarget: number;
  locationTargets: Record<string, { monthly: number; weekly: number }>;
}

const getStoredGoals = (): StoredGoals => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading goals from storage:', e);
  }
  return {
    monthlyTarget: 50000, // Default monthly goal
    weeklyTarget: 12500, // Default weekly goal
    locationTargets: {},
  };
};

const setStoredGoals = (goals: StoredGoals) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error('Error saving goals to storage:', e);
  }
};

export function useSalesGoals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['sales-goals'],
    queryFn: async () => {
      return getStoredGoals();
    },
    staleTime: Infinity, // Goals don't change frequently
  });

  const updateGoals = useMutation({
    mutationFn: async (goals: Partial<StoredGoals>) => {
      const current = getStoredGoals();
      const updated = { ...current, ...goals };
      setStoredGoals(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-goals'] });
      toast({
        title: 'Goals updated',
        description: 'Your sales targets have been saved.',
      });
    },
  });

  return {
    goals: query.data,
    isLoading: query.isLoading,
    updateGoals: updateGoals.mutate,
    isUpdating: updateGoals.isPending,
  };
}
