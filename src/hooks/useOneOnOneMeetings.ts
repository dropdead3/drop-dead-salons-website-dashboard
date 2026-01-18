import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Coach {
  user_id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
}

export interface OneOnOneMeeting {
  id: string;
  requester_id: string;
  coach_id: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  meeting_type: string | null;
  created_at: string;
  updated_at: string;
  requester?: {
    full_name: string;
    display_name: string | null;
  };
  coach?: {
    full_name: string;
    display_name: string | null;
  };
}

// Fetch available coaches (admins and managers)
export function useAvailableCoaches() {
  return useQuery({
    queryKey: ['available-coaches'],
    queryFn: async () => {
      // First get user_ids with admin or manager roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'manager']);

      if (roleError) throw roleError;

      const coachUserIds = roleData?.map(r => r.user_id) || [];

      if (coachUserIds.length === 0) return [];

      // Then fetch their profiles
      const { data: profiles, error: profileError } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', coachUserIds)
        .eq('is_active', true);

      if (profileError) throw profileError;

      return profiles as Coach[];
    },
  });
}

// Fetch user's meetings
export function useOneOnOneMeetings() {
  const { user, isCoach } = useAuth();

  return useQuery({
    queryKey: ['one-on-one-meetings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('one_on_one_meetings')
        .select('*')
        .order('meeting_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Fetch requester and coach profiles separately
      const requesterIds = [...new Set(data?.map(m => m.requester_id) || [])];
      const coachIds = [...new Set(data?.map(m => m.coach_id) || [])];
      const allUserIds = [...new Set([...requesterIds, ...coachIds])];

      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name')
        .in('user_id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(meeting => ({
        ...meeting,
        requester: profileMap.get(meeting.requester_id),
        coach: profileMap.get(meeting.coach_id),
      })) as OneOnOneMeeting[];
    },
    enabled: !!user,
  });
}

// Create a new meeting request
export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      coach_id: string;
      meeting_date: string;
      start_time: string;
      end_time: string;
      meeting_type: string;
      notes?: string;
    }) => {
      const { data: meeting, error } = await supabase
        .from('one_on_one_meetings')
        .insert({
          requester_id: user!.id,
          coach_id: data.coach_id,
          meeting_date: data.meeting_date,
          start_time: data.start_time,
          end_time: data.end_time,
          meeting_type: data.meeting_type,
          notes: data.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['one-on-one-meetings'] });
      toast.success('Meeting request submitted!');
    },
    onError: (error) => {
      console.error('Error creating meeting:', error);
      toast.error('Failed to submit meeting request');
    },
  });
}

// Update meeting status
export function useUpdateMeetingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('one_on_one_meetings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['one-on-one-meetings'] });
      toast.success('Meeting status updated');
    },
    onError: (error) => {
      console.error('Error updating meeting:', error);
      toast.error('Failed to update meeting');
    },
  });
}
