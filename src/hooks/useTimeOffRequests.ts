import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type TimeOffRequestType = 'vacation' | 'sick' | 'personal' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'denied';

export interface TimeOffRequest {
  id: string;
  organization_id: string;
  user_id: string;
  calendar_event_id: string | null;
  request_type: TimeOffRequestType;
  start_date: string;
  end_date: string;
  notes: string | null;
  status: TimeOffStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester?: {
    full_name: string | null;
    display_name: string | null;
    photo_url: string | null;
  };
  reviewer?: {
    full_name: string | null;
    display_name: string | null;
  };
}

export interface CreateTimeOffInput {
  request_type: TimeOffRequestType;
  start_date: string;
  end_date: string;
  notes?: string;
}

export function useMyTimeOffRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['time-off-requests', 'my', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TimeOffRequest[];
    },
    enabled: !!user?.id,
  });
}

export function useTeamTimeOffRequests(status?: TimeOffStatus) {
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['time-off-requests', 'team', effectiveOrganization?.id, status],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return [];

      let query = supabase
        .from('time_off_requests')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: requests, error } = await query;

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Get requester profiles
      const userIds = [...new Set(requests.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return requests.map(r => ({
        ...r,
        request_type: r.request_type as TimeOffRequestType,
        status: r.status as TimeOffStatus,
        requester: profileMap.get(r.user_id),
      })) as TimeOffRequest[];
    },
    enabled: !!effectiveOrganization?.id,
  });
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (input: CreateTimeOffInput) => {
      if (!user?.id || !effectiveOrganization?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('time_off_requests')
        .insert({
          ...input,
          user_id: user.id,
          organization_id: effectiveOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TimeOffRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Time off request submitted');
    },
    onError: (error) => {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    },
  });
}

export function useReviewTimeOffRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      createCalendarEvent 
    }: { 
      requestId: string; 
      status: 'approved' | 'denied';
      createCalendarEvent?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Update the request status
      const { data: request, error } = await supabase
        .from('time_off_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select('*')
        .single();

      if (error) throw error;

      // Get requester profile
      const { data: profile } = await supabase
        .from('employee_profiles')
        .select('full_name, display_name')
        .eq('user_id', request.user_id)
        .single();

      // If approved and createCalendarEvent is true, create a calendar event
      if (status === 'approved' && createCalendarEvent && effectiveOrganization?.id) {
        const requesterName = profile?.display_name || profile?.full_name || 'Team Member';
        
        const { data: calendarEvent } = await supabase
          .from('team_calendar_events')
          .insert({
            organization_id: effectiveOrganization.id,
            title: `${requesterName} - Time Off`,
            event_type: 'time_off',
            start_date: request.start_date,
            end_date: request.end_date,
            all_day: true,
            visibility: 'team',
            created_by: user.id,
            metadata: { time_off_request_id: requestId },
          })
          .select()
          .single();

        // Link calendar event to request
        if (calendarEvent) {
          await supabase
            .from('time_off_requests')
            .update({ calendar_event_id: calendarEvent.id })
            .eq('id', requestId);
        }
      }

      return {
        ...request,
        request_type: request.request_type as TimeOffRequestType,
        status: request.status as TimeOffStatus,
        requester: profile,
      } as TimeOffRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['team-calendar-events'] });
      toast.success(`Request ${variables.status}`);
    },
    onError: (error) => {
      console.error('Failed to review request:', error);
      toast.error('Failed to review request');
    },
  });
}

export function useCancelTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Request cancelled');
    },
    onError: (error) => {
      console.error('Failed to cancel request:', error);
      toast.error('Failed to cancel request');
    },
  });
}

export const TIME_OFF_TYPE_LABELS: Record<TimeOffRequestType, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  personal: 'Personal',
  other: 'Other',
};

export const TIME_OFF_STATUS_COLORS: Record<TimeOffStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  denied: 'bg-red-500/10 text-red-600 border-red-500/20',
};
