import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamGoal {
  id: string;
  location_id: string | null;
  target_revenue: number;
  goal_period: 'monthly' | 'weekly' | 'quarterly';
  period_start: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Using local storage for now - can be upgraded to DB table later
const STORAGE_KEY = 'team-goals';

interface StoredTeamGoals {
  monthlyTarget: number;
  weeklyTarget: number;
  quarterlyTarget: number;
  description: string;
  milestones: { amount: number; reward: string }[];
}

const getStoredGoals = (): StoredTeamGoals => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading team goals:', e);
  }
  return {
    monthlyTarget: 100000,
    weeklyTarget: 25000,
    quarterlyTarget: 300000,
    description: 'Team revenue goal',
    milestones: [
      { amount: 50000, reward: 'Pizza party 🍕' },
      { amount: 75000, reward: 'Team outing' },
      { amount: 100000, reward: 'Bonus pool!' },
    ],
  };
};

const setStoredGoals = (goals: StoredTeamGoals) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error('Error saving team goals:', e);
  }
};

export function useTeamGoals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['team-goals'],
    queryFn: async () => {
      return getStoredGoals();
    },
    staleTime: Infinity,
  });

  const updateGoals = useMutation({
    mutationFn: async (goals: Partial<StoredTeamGoals>) => {
      const current = getStoredGoals();
      const updated = { ...current, ...goals };
      setStoredGoals(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-goals'] });
      toast({
        title: 'Team goals updated',
        description: 'The team targets have been saved.',
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
