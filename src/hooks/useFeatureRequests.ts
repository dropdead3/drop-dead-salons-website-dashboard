import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  submitted_by: string;
  linked_changelog_id: string | null;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  user_voted?: boolean;
  submitter_name?: string;
}

export interface CreateFeatureRequest {
  title: string;
  description: string;
  category?: string;
}

export const FEATURE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'reporting', label: 'Reporting & Analytics' },
  { value: 'training', label: 'Training & Development' },
  { value: 'client_engine', label: 'Client Engine' },
  { value: 'communication', label: 'Communication' },
  { value: 'mobile', label: 'Mobile Experience' },
];

export const FEATURE_STATUSES = [
  { value: 'submitted', label: 'Submitted', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { value: 'planned', label: 'Planned', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
];

// Fetch all feature requests
export function useFeatureRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feature-requests'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get vote counts
      const { data: votes } = await supabase
        .from('feature_request_votes')
        .select('feature_request_id');

      const { data: userVotes } = await supabase
        .from('feature_request_votes')
        .select('feature_request_id')
        .eq('user_id', user?.id || '');

      const voteCounts = new Map<string, number>();
      votes?.forEach(v => {
        voteCounts.set(v.feature_request_id, (voteCounts.get(v.feature_request_id) || 0) + 1);
      });

      const userVoteIds = new Set(userVotes?.map(v => v.feature_request_id) || []);

      // Get submitter names
      const submitterIds = [...new Set(requests?.map(r => r.submitted_by) || [])];
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name')
        .in('user_id', submitterIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name || p.full_name]) || []);

      return (requests || []).map(request => ({
        ...request,
        vote_count: voteCounts.get(request.id) || 0,
        user_voted: userVoteIds.has(request.id),
        submitter_name: profileMap.get(request.submitted_by) || 'Unknown',
      })) as FeatureRequest[];
    },
    enabled: !!user,
  });
}

// Submit a feature request
export function useSubmitFeatureRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateFeatureRequest) => {
      if (!user) throw new Error('Not authenticated');

      const { data: request, error } = await supabase
        .from('feature_requests')
        .insert({
          ...data,
          submitted_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success('Feature request submitted!', {
        description: 'Thank you for your feedback. We review all suggestions.',
      });
    },
    onError: (error) => {
      toast.error('Failed to submit request', { description: error.message });
    },
  });
}

// Update a feature request (admin)
export function useUpdateFeatureRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<FeatureRequest> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data };
      
      // If status or admin_response changed, update responded fields
      if (data.status || data.admin_response) {
        updateData.responded_by = user?.id;
        updateData.responded_at = new Date().toISOString();
      }

      const { data: request, error } = await supabase
        .from('feature_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success('Feature request updated');
    },
    onError: (error) => {
      toast.error('Failed to update request', { description: error.message });
    },
  });
}

// Delete a feature request (admin)
export function useDeleteFeatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success('Feature request deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete request', { description: error.message });
    },
  });
}

// Vote on a feature request
export function useVoteFeatureRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, vote }: { requestId: string; vote: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (vote) {
        const { error } = await supabase
          .from('feature_request_votes')
          .insert({
            feature_request_id: requestId,
            user_id: user.id,
          });
        if (error && !error.message.includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('feature_request_votes')
          .delete()
          .eq('feature_request_id', requestId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
    },
  });
}

// Link a feature request to a changelog entry
export function useLinkToChangelog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, changelogId }: { requestId: string; changelogId: string | null }) => {
      const { error } = await supabase
        .from('feature_requests')
        .update({
          linked_changelog_id: changelogId,
          status: changelogId ? 'completed' : 'planned',
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
      toast.success('Feature request linked to changelog');
    },
    onError: (error) => {
      toast.error('Failed to link request', { description: error.message });
    },
  });
}
