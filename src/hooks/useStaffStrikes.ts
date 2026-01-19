import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StrikeType = 'write_up' | 'complaint' | 'red_flag' | 'warning' | 'issue' | 'other';
export type StrikeSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface StaffStrike {
  id: string;
  user_id: string;
  created_by: string;
  strike_type: StrikeType;
  severity: StrikeSeverity;
  title: string;
  description: string | null;
  incident_date: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffStrikeWithDetails extends StaffStrike {
  employee_name?: string;
  employee_photo?: string | null;
  created_by_name?: string;
  resolved_by_name?: string;
}

export const STRIKE_TYPE_LABELS: Record<StrikeType, string> = {
  write_up: 'Write-Up',
  complaint: 'Complaint',
  red_flag: 'Red Flag',
  warning: 'Warning',
  issue: 'Issue',
  other: 'Other',
};

export const STRIKE_TYPE_COLORS: Record<StrikeType, string> = {
  write_up: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  complaint: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  red_flag: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  issue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  other: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
};

export const SEVERITY_LABELS: Record<StrikeSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SEVERITY_COLORS: Record<StrikeSeverity, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// Fetch all strikes with employee details
export function useStaffStrikes(userId?: string) {
  return useQuery({
    queryKey: ['staff-strikes', userId],
    queryFn: async () => {
      let query = supabase
        .from('staff_strikes')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: strikes, error } = await query;

      if (error) throw error;

      if (!strikes || strikes.length === 0) return [];

      // Get unique user IDs for employee details
      const userIds = [...new Set(strikes.map(s => s.user_id))];
      const createdByIds = [...new Set(strikes.map(s => s.created_by))];
      const resolvedByIds = strikes
        .filter(s => s.resolved_by)
        .map(s => s.resolved_by as string);
      
      const allUserIds = [...new Set([...userIds, ...createdByIds, ...resolvedByIds])];

      // Fetch employee profiles
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', allUserIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );

      return strikes.map(strike => ({
        ...strike,
        employee_name: profileMap.get(strike.user_id)?.display_name || 
                       profileMap.get(strike.user_id)?.full_name || 'Unknown',
        employee_photo: profileMap.get(strike.user_id)?.photo_url,
        created_by_name: profileMap.get(strike.created_by)?.display_name || 
                         profileMap.get(strike.created_by)?.full_name || 'Unknown',
        resolved_by_name: strike.resolved_by 
          ? profileMap.get(strike.resolved_by)?.display_name || 
            profileMap.get(strike.resolved_by)?.full_name || 'Unknown'
          : null,
      })) as StaffStrikeWithDetails[];
    },
  });
}

// Get strike count for a specific user
export function useUserStrikeCount(userId: string) {
  return useQuery({
    queryKey: ['staff-strikes-count', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('staff_strikes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_resolved', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}

// Get strike counts for multiple users (for directory)
export function useStrikeCounts(userIds: string[]) {
  return useQuery({
    queryKey: ['staff-strikes-counts', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};

      const { data, error } = await supabase
        .from('staff_strikes')
        .select('user_id')
        .in('user_id', userIds)
        .eq('is_resolved', false);

      if (error) throw error;

      // Count strikes per user
      const counts: Record<string, number> = {};
      data?.forEach(strike => {
        counts[strike.user_id] = (counts[strike.user_id] || 0) + 1;
      });
      return counts;
    },
    enabled: userIds.length > 0,
  });
}

// Create a new strike
export function useCreateStrike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      strike_type: StrikeType;
      severity: StrikeSeverity;
      title: string;
      description?: string;
      incident_date: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: strike, error } = await supabase
        .from('staff_strikes')
        .insert({
          ...data,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return strike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-strikes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-count'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-counts'] });
      toast.success('Strike added successfully');
    },
    onError: (error) => {
      console.error('Failed to create strike:', error);
      toast.error('Failed to add strike', {
        description: error.message,
      });
    },
  });
}

// Update a strike
export function useUpdateStrike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<StaffStrike> & { id: string }) => {
      const { data: strike, error } = await supabase
        .from('staff_strikes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return strike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-strikes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-count'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-counts'] });
      toast.success('Strike updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update strike:', error);
      toast.error('Failed to update strike', {
        description: error.message,
      });
    },
  });
}

// Resolve a strike
export function useResolveStrike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      resolution_notes,
    }: {
      id: string;
      resolution_notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: strike, error } = await supabase
        .from('staff_strikes')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.user.id,
          resolution_notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return strike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-strikes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-count'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-counts'] });
      toast.success('Strike resolved');
    },
    onError: (error) => {
      console.error('Failed to resolve strike:', error);
      toast.error('Failed to resolve strike', {
        description: error.message,
      });
    },
  });
}

// Delete a strike
export function useDeleteStrike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_strikes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-strikes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-count'] });
      queryClient.invalidateQueries({ queryKey: ['staff-strikes-counts'] });
      toast.success('Strike deleted');
    },
    onError: (error) => {
      console.error('Failed to delete strike:', error);
      toast.error('Failed to delete strike', {
        description: error.message,
      });
    },
  });
}
