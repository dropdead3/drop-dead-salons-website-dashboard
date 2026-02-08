import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ChatChannel = Database['public']['Tables']['chat_channels']['Row'];
type ChatChannelInsert = Database['public']['Tables']['chat_channels']['Insert'];
type ChatChannelMember = Database['public']['Tables']['chat_channel_members']['Row'];

export interface ChannelWithMembership extends ChatChannel {
  membership?: ChatChannelMember;
  unread_count?: number;
}

export function useChatChannels() {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  const { data: channels, isLoading, error } = useQuery({
    queryKey: ['chat-channels', effectiveOrganization?.id],
    queryFn: async () => {
      if (!user?.id || !effectiveOrganization?.id) return [];

      // Get channels user is a member of
      const { data: memberChannels, error: memberError } = await supabase
        .from('chat_channel_members')
        .select(`
          channel_id,
          role,
          is_muted,
          last_read_at,
          chat_channels (*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Also get public channels in the org that user might not be a member of yet
      const { data: publicChannels, error: publicError } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .eq('type', 'public')
        .eq('is_archived', false);

      if (publicError) throw publicError;

      // Merge and dedupe
      const channelMap = new Map<string, ChannelWithMembership>();

      // Add member channels first with membership info
      memberChannels?.forEach((mc) => {
        const channel = mc.chat_channels as unknown as ChatChannel;
        if (channel) {
          channelMap.set(channel.id, {
            ...channel,
            membership: {
              id: '',
              channel_id: mc.channel_id,
              user_id: user.id,
              role: mc.role,
              is_muted: mc.is_muted,
              muted_until: null,
              last_read_at: mc.last_read_at,
              joined_at: null,
              updated_at: null,
            } as ChatChannelMember,
          });
        }
      });

      // Add public channels without membership
      publicChannels?.forEach((channel) => {
        if (!channelMap.has(channel.id)) {
          channelMap.set(channel.id, channel);
        }
      });

      return Array.from(channelMap.values()).sort((a, b) => {
        // Sort: system channels first, then by name
        if (a.is_system && !b.is_system) return -1;
        if (!a.is_system && b.is_system) return 1;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!user?.id && !!effectiveOrganization?.id,
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: Omit<ChatChannelInsert, 'organization_id' | 'created_by'>) => {
      if (!user?.id || !effectiveOrganization?.id) {
        throw new Error('Not authenticated');
      }

      const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert({
          ...data,
          organization_id: effectiveOrganization.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator as owner
      const { error: memberError } = await supabase
        .from('chat_channel_members')
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      toast.success('Channel created');
    },
    onError: (error) => {
      console.error('Failed to create channel:', error);
      toast.error('Failed to create channel');
    },
  });

  const joinChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_channel_members')
        .insert({
          channel_id: channelId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
    onError: (error) => {
      console.error('Failed to join channel:', error);
      toast.error('Failed to join channel');
    },
  });

  const leaveChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_channel_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      toast.success('Left channel');
    },
    onError: (error) => {
      console.error('Failed to leave channel:', error);
      toast.error('Failed to leave channel');
    },
  });

  return {
    channels: channels ?? [],
    isLoading,
    error,
    createChannel: createChannelMutation.mutate,
    joinChannel: joinChannelMutation.mutate,
    leaveChannel: leaveChannelMutation.mutate,
    isCreating: createChannelMutation.isPending,
  };
}

export function useInitializeDefaultChannels() {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !effectiveOrganization?.id) {
        throw new Error('Not authenticated');
      }

      // Check if default channels already exist
      const { data: existingChannels } = await supabase
        .from('chat_channels')
        .select('name')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_system', true);

      if (existingChannels && existingChannels.length > 0) {
        return; // Already initialized
      }

      // Create default system channels
      const defaultChannels = [
        { name: 'company-wide', description: 'Organization-wide announcements', icon: 'megaphone', type: 'public' as const },
        { name: 'general', description: 'General discussions', icon: 'hash', type: 'public' as const },
      ];

      for (const channel of defaultChannels) {
        const { data: newChannel, error } = await supabase
          .from('chat_channels')
          .insert({
            ...channel,
            organization_id: effectiveOrganization.id,
            created_by: user.id,
            is_system: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to create default channel:', error);
          continue;
        }

        // Auto-join creator
        await supabase
          .from('chat_channel_members')
          .insert({
            channel_id: newChannel.id,
            user_id: user.id,
            role: 'owner',
          });
      }

      // Get locations and create location channels
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_active', true);

      if (locations) {
        for (const location of locations) {
          const slug = location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const { data: locChannel, error } = await supabase
            .from('chat_channels')
            .insert({
              name: slug,
              description: `Channel for ${location.name}`,
              icon: 'map-pin',
              type: 'location' as const,
              location_id: location.id,
              organization_id: effectiveOrganization.id,
              created_by: user.id,
              is_system: true,
            })
            .select()
            .single();

          if (!error && locChannel) {
            await supabase
              .from('chat_channel_members')
              .insert({
                channel_id: locChannel.id,
                user_id: user.id,
                role: 'owner',
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
  });
}
