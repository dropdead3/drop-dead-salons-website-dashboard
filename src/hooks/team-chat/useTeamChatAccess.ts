import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type ChannelType = Database['public']['Enums']['chat_channel_type'];

export interface TeamMemberChannel {
  id: string;
  name: string;
  type: ChannelType;
}

export interface TeamMemberChatAccess {
  userId: string;
  displayName: string | null;
  fullName: string | null;
  photoUrl: string | null;
  email: string | null;
  accountRoles: AppRole[];
  chatEnabled: boolean;
  channels: TeamMemberChannel[];
}

export interface OrgChannel {
  id: string;
  name: string;
  type: ChannelType;
  description: string | null;
  locationId: string | null;
  isSystem: boolean;
}

export function useTeamChatAccess() {
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  // Fetch all team members with their channel memberships
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['team-chat-access', effectiveOrganization?.id],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return [];

      // Get all org members
      const { data: profiles, error: profilesError } = await supabase
        .from('employee_profiles')
        .select('user_id, display_name, full_name, photo_url, email, chat_enabled')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_active', true)
        .eq('is_approved', true);

      if (profilesError) throw profilesError;

      // Get user roles for all members
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Create roles map
      const rolesMap = new Map<string, AppRole[]>();
      rolesData?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role as AppRole]);
      });

      // Get channel memberships for all members
      const { data: memberships } = await supabase
        .from('chat_channel_members')
        .select(`
          user_id,
          channel:chat_channels!chat_channel_members_channel_id_fkey (
            id,
            name,
            type
          )
        `)
        .in('user_id', userIds);

      // Create channel memberships map
      const channelsMap = new Map<string, TeamMemberChannel[]>();
      memberships?.forEach(m => {
        if (m.channel) {
          const existing = channelsMap.get(m.user_id) || [];
          const channel = m.channel as { id: string; name: string; type: ChannelType };
          // Exclude DMs
          if (channel.type !== 'dm') {
            channelsMap.set(m.user_id, [...existing, {
              id: channel.id,
              name: channel.name,
              type: channel.type,
            }]);
          }
        }
      });

      return profiles?.map(p => ({
        userId: p.user_id,
        displayName: p.display_name,
        fullName: p.full_name,
        photoUrl: p.photo_url,
        email: p.email,
        accountRoles: rolesMap.get(p.user_id) || [],
        chatEnabled: p.chat_enabled ?? true,
        channels: channelsMap.get(p.user_id) || [],
      })) as TeamMemberChatAccess[];
    },
    enabled: !!effectiveOrganization?.id,
  });

  // Fetch all org channels (excluding DMs)
  const { data: orgChannels, isLoading: channelsLoading } = useQuery({
    queryKey: ['org-channels', effectiveOrganization?.id],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return [];

      const { data, error } = await supabase
        .from('chat_channels')
        .select('id, name, type, description, location_id, is_system')
        .eq('organization_id', effectiveOrganization.id)
        .neq('type', 'dm')
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;

      return data?.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description,
        locationId: c.location_id,
        isSystem: c.is_system ?? false,
      })) as OrgChannel[];
    },
    enabled: !!effectiveOrganization?.id,
  });

  // Toggle chat enabled/disabled for a user
  const toggleChatMutation = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('employee_profiles')
        .update({ chat_enabled: enabled })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['team-chat-access'] });
      toast.success(enabled ? 'Chat access enabled' : 'Chat access disabled');
    },
    onError: () => {
      toast.error('Failed to update chat access');
    },
  });

  // Add a user to a channel
  const addToChannelMutation = useMutation({
    mutationFn: async ({ userId, channelId }: { userId: string; channelId: string }) => {
      const { error } = await supabase
        .from('chat_channel_members')
        .insert({
          user_id: userId,
          channel_id: channelId,
          role: 'member',
        });

      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-chat-access'] });
    },
    onError: () => {
      toast.error('Failed to add user to channel');
    },
  });

  // Remove a user from a channel
  const removeFromChannelMutation = useMutation({
    mutationFn: async ({ userId, channelId }: { userId: string; channelId: string }) => {
      const { error } = await supabase
        .from('chat_channel_members')
        .delete()
        .eq('user_id', userId)
        .eq('channel_id', channelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-chat-access'] });
    },
    onError: () => {
      toast.error('Failed to remove user from channel');
    },
  });

  // Bulk update channel memberships for a user
  const updateChannelsMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      channelsToAdd, 
      channelsToRemove 
    }: { 
      userId: string; 
      channelsToAdd: string[]; 
      channelsToRemove: string[]; 
    }) => {
      // Remove channels
      if (channelsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('chat_channel_members')
          .delete()
          .eq('user_id', userId)
          .in('channel_id', channelsToRemove);

        if (removeError) throw removeError;
      }

      // Add channels
      if (channelsToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('chat_channel_members')
          .upsert(
            channelsToAdd.map(channelId => ({
              user_id: userId,
              channel_id: channelId,
              role: 'member' as const,
            })),
            { onConflict: 'user_id,channel_id' }
          );

        if (addError) throw addError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-chat-access'] });
      queryClient.invalidateQueries({ queryKey: ['channel-members'] });
      toast.success('Channel access updated');
    },
    onError: () => {
      toast.error('Failed to update channel access');
    },
  });

  return {
    members: members ?? [],
    orgChannels: orgChannels ?? [],
    isLoading: membersLoading || channelsLoading,
    toggleChat: toggleChatMutation.mutate,
    addToChannel: addToChannelMutation.mutate,
    removeFromChannel: removeFromChannelMutation.mutate,
    updateChannels: updateChannelsMutation.mutate,
    isUpdating: toggleChatMutation.isPending || updateChannelsMutation.isPending,
  };
}
