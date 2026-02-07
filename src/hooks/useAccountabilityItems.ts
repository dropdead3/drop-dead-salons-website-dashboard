import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ItemPriority = 'low' | 'medium' | 'high';

export interface AccountabilityItem {
  id: string;
  meeting_id: string | null;
  coach_id: string;
  team_member_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  reminder_date: string | null;
  reminder_sent: boolean;
  status: ItemStatus;
  priority: ItemPriority;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  team_member?: {
    full_name: string;
    display_name: string | null;
    photo_url: string | null;
  };
  coach?: {
    full_name: string;
    display_name: string | null;
  };
}

// Fetch items for a specific meeting
export function useMeetingAccountabilityItems(meetingId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accountability-items', 'meeting', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accountability_items')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch team member profiles
      const teamMemberIds = [...new Set(data?.map(i => i.team_member_id) || [])];
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', teamMemberIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(item => ({
        ...item,
        team_member: profileMap.get(item.team_member_id),
      })) as AccountabilityItem[];
    },
    enabled: !!meetingId && !!user,
  });
}

// Fetch all items for a coach (dashboard view)
export function useCoachAccountabilityItems() {
  const { user, isCoach } = useAuth();

  return useQuery({
    queryKey: ['accountability-items', 'coach', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accountability_items')
        .select('*')
        .eq('coach_id', user!.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Fetch team member profiles
      const teamMemberIds = [...new Set(data?.map(i => i.team_member_id) || [])];
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', teamMemberIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(item => ({
        ...item,
        team_member: profileMap.get(item.team_member_id),
      })) as AccountabilityItem[];
    },
    enabled: !!user && isCoach,
  });
}

// Fetch items assigned to current user (team member view)
export function useMyAccountabilityItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accountability-items', 'my', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accountability_items')
        .select('*')
        .eq('team_member_id', user!.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Fetch coach profiles
      const coachIds = [...new Set(data?.map(i => i.coach_id) || [])];
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name')
        .in('user_id', coachIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(item => ({
        ...item,
        coach: profileMap.get(item.coach_id),
      })) as AccountabilityItem[];
    },
    enabled: !!user,
  });
}

export function useCreateAccountabilityItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      meeting_id?: string;
      team_member_id: string;
      title: string;
      description?: string;
      due_date?: string;
      reminder_date?: string;
      priority?: ItemPriority;
    }) => {
      const { data: item, error } = await supabase
        .from('accountability_items')
        .insert({
          meeting_id: data.meeting_id || null,
          coach_id: user!.id,
          team_member_id: data.team_member_id,
          title: data.title,
          description: data.description || null,
          due_date: data.due_date || null,
          reminder_date: data.reminder_date || null,
          priority: data.priority || 'medium',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-items'] });
      toast.success('Action item created');
    },
    onError: (error) => {
      console.error('Error creating item:', error);
      toast.error('Failed to create action item');
    },
  });
}

export function useUpdateAccountabilityItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
      due_date?: string | null;
      reminder_date?: string | null;
      status?: ItemStatus;
      priority?: ItemPriority;
      completion_notes?: string;
      completed_at?: string | null;
    }) => {
      const { error } = await supabase
        .from('accountability_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-items'] });
      toast.success('Item updated');
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    },
  });
}

export function useCompleteAccountabilityItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completion_notes,
    }: {
      id: string;
      completion_notes?: string;
    }) => {
      const { error } = await supabase
        .from('accountability_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: completion_notes || null,
        })
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-items'] });
      toast.success('Item marked as complete!');
    },
    onError: (error) => {
      console.error('Error completing item:', error);
      toast.error('Failed to complete item');
    },
  });
}

export function useDeleteAccountabilityItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accountability_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-items'] });
      toast.success('Item deleted');
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    },
  });
}
