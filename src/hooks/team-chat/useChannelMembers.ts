import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type MemberRole = Database['public']['Enums']['chat_member_role'];
type AppRole = Database['public']['Enums']['app_role'];

export interface ChannelMember {
  id: string;
  userId: string;
  role: MemberRole;
  accountRoles: AppRole[];
  joinedAt: string | null;
  profile: {
    displayName: string | null;
    fullName: string | null;
    photoUrl: string | null;
  };
}

export function useChannelMembers(channelId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['channel-members', channelId],
    queryFn: async () => {
      if (!channelId) return [];

      // Fetch channel members with profile data
      const { data, error } = await supabase
        .from('chat_channel_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profile:employee_profiles!chat_channel_members_employee_fkey (
            display_name,
            full_name,
            photo_url
          )
        `)
        .eq('channel_id', channelId);

      if (error) throw error;

      // Get all user IDs to fetch their account roles
      const userIds = data?.map((m) => m.user_id) || [];
      
      // Fetch account roles for all members
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Create a map of user_id to roles array
      const rolesMap = new Map<string, AppRole[]>();
      rolesData?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role as AppRole]);
      });

      return data?.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        accountRoles: rolesMap.get(m.user_id) || [],
        joinedAt: m.joined_at,
        profile: {
          displayName: (m.profile as any)?.display_name,
          fullName: (m.profile as any)?.full_name,
          photoUrl: (m.profile as any)?.photo_url,
        },
      })) as ChannelMember[];
    },
    enabled: !!channelId,
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role = 'member' }: { userId: string; role?: MemberRole }) => {
      if (!channelId) throw new Error('No channel selected');

      const { error } = await supabase
        .from('chat_channel_members')
        .insert({
          channel_id: channelId,
          user_id: userId,
          role,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-members', channelId] });
      toast.success('Member added');
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!channelId) throw new Error('No channel selected');

      const { error } = await supabase
        .from('chat_channel_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-members', channelId] });
      toast.success('Member removed');
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: MemberRole }) => {
      if (!channelId) throw new Error('No channel selected');

      const { error } = await supabase
        .from('chat_channel_members')
        .update({ role })
        .eq('channel_id', channelId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-members', channelId] });
      toast.success('Role updated');
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });

  const myRole = members?.find((m) => m.userId === user?.id)?.role;

  return {
    members: members ?? [],
    isLoading,
    addMember: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    myRole,
    isOwner: myRole === 'owner',
    isAdmin: myRole === 'owner' || myRole === 'admin',
  };
}
