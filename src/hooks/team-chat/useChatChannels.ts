import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ChatChannel = Database['public']['Tables']['chat_channels']['Row'];
type ChatChannelInsert = Database['public']['Tables']['chat_channels']['Insert'];
type ChatChannelMember = Database['public']['Tables']['chat_channel_members']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

export interface ChannelWithMembership extends ChatChannel {
  membership?: ChatChannelMember & { is_hidden?: boolean };
  unread_count?: number;
  dm_partner?: {
    user_id: string;
    display_name: string;
    photo_url: string | null;
    roles: AppRole[];
  };
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
          is_hidden,
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

      // Add member channels first with membership info (excluding hidden DMs)
      memberChannels?.forEach((mc) => {
        const channel = mc.chat_channels as unknown as ChatChannel;
        if (channel) {
          // Skip hidden DM channels from sidebar
          const isDM = channel.type === 'dm' || channel.type === 'group_dm';
          if (isDM && mc.is_hidden) return;
          
          channelMap.set(channel.id, {
            ...channel,
            membership: {
              id: '',
              channel_id: mc.channel_id,
              user_id: user.id,
              role: mc.role,
              is_muted: mc.is_muted,
              is_hidden: mc.is_hidden,
              muted_until: null,
              last_read_at: mc.last_read_at,
              joined_at: null,
              updated_at: null,
            } as ChatChannelMember & { is_hidden?: boolean },
          });
        }
      });

      // Add public channels without membership
      publicChannels?.forEach((channel) => {
        if (!channelMap.has(channel.id)) {
          channelMap.set(channel.id, channel);
        }
      });

      // For DM channels, fetch the partner's profile info
      const dmChannelIds = Array.from(channelMap.values())
        .filter(c => c.type === 'dm' || c.type === 'group_dm')
        .map(c => c.id);

      if (dmChannelIds.length > 0) {
        // Get all members for DM channels
        const { data: dmMembers } = await supabase
          .from('chat_channel_members')
          .select(`
            channel_id,
            user_id,
            employee_profiles!chat_channel_members_employee_fkey (
              display_name,
              full_name,
              photo_url
            )
          `)
          .in('channel_id', dmChannelIds)
          .neq('user_id', user.id);

        // Fetch roles for DM partners
        const partnerUserIds = dmMembers?.map((m) => m.user_id) || [];
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', partnerUserIds);

        // Build roles map
        const rolesMap = new Map<string, AppRole[]>();
        userRoles?.forEach((r) => {
          const existing = rolesMap.get(r.user_id) || [];
          rolesMap.set(r.user_id, [...existing, r.role as AppRole]);
        });

        // Map partner info to channels
        dmMembers?.forEach((member) => {
          const channel = channelMap.get(member.channel_id);
          if (channel) {
            const profile = member.employee_profiles as any;
            channel.dm_partner = {
              user_id: member.user_id,
              display_name: profile?.display_name || profile?.full_name || 'Unknown',
              photo_url: profile?.photo_url || null,
              roles: rolesMap.get(member.user_id) || [],
            };
          }
        });
      }

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

      // Get all org members for auto-joining
      const { data: orgMembers } = await supabase
        .from('employee_profiles')
        .select('user_id, location_id, location_ids')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_active', true)
        .eq('is_approved', true);

      const createdPublicChannels: { id: string }[] = [];
      const createdLocationChannels: { id: string; location_id: string }[] = [];

      // Check if organization is multi-location
      const isMultiLocation = effectiveOrganization.is_multi_location ?? false;

      // Create default system channels - only include company-wide for multi-location orgs
      const defaultChannels = isMultiLocation
        ? [
            { name: 'company-wide', description: 'Organization-wide announcements', icon: 'megaphone', type: 'public' as const },
            { name: 'general', description: 'General discussions', icon: 'hash', type: 'public' as const },
          ]
        : [
            { name: 'general', description: 'Team discussions', icon: 'hash', type: 'public' as const },
          ];

      // Create renters private channel (booth renters + leadership)
      const { data: existingRentersChannel } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('organization_id', effectiveOrganization.id)
        .eq('name', 'renters')
        .eq('type', 'private')
        .maybeSingle();

      if (!existingRentersChannel) {
        const { data: rentersChannel } = await supabase
          .from('chat_channels')
          .insert({
            name: 'renters',
            description: 'Private channel for booth renters',
            icon: 'store',
            type: 'private' as const,
            organization_id: effectiveOrganization.id,
            created_by: user.id,
            is_system: true,
          })
          .select()
          .single();

        if (rentersChannel) {
          // Add creator as owner
          await supabase
            .from('chat_channel_members')
            .insert({
              channel_id: rentersChannel.id,
              user_id: user.id,
              role: 'owner',
            });

          // Auto-add all booth renters to the channel
          const { data: boothRenters } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'booth_renter');

          if (boothRenters && boothRenters.length > 0) {
            const renterMemberships = boothRenters
              .filter(r => r.user_id !== user.id)
              .map(r => ({
                channel_id: rentersChannel.id,
                user_id: r.user_id,
                role: 'member' as const,
              }));

            if (renterMemberships.length > 0) {
              await supabase
                .from('chat_channel_members')
                .upsert(renterMemberships, { onConflict: 'channel_id,user_id' });
            }
          }

          // Auto-add admins/managers to the renters channel
          const { data: leadershipUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['super_admin', 'admin', 'manager']);

          if (leadershipUsers && leadershipUsers.length > 0) {
            const leadershipMemberships = leadershipUsers
              .filter(l => l.user_id !== user.id)
              .map(l => ({
                channel_id: rentersChannel.id,
                user_id: l.user_id,
                role: 'member' as const,
              }));

            if (leadershipMemberships.length > 0) {
              await supabase
                .from('chat_channel_members')
                .upsert(leadershipMemberships, { onConflict: 'channel_id,user_id' });
            }
          }
        }
      }

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

        createdPublicChannels.push({ id: newChannel.id });

        // Auto-join creator as owner
        await supabase
          .from('chat_channel_members')
          .insert({
            channel_id: newChannel.id,
            user_id: user.id,
            role: 'owner',
          });
      }

      // Only create location channels for multi-location organizations
      if (isMultiLocation) {
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
              createdLocationChannels.push({ id: locChannel.id, location_id: location.id });

              // Auto-join creator as owner
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
      }

      // Auto-join all org members to public channels
      if (orgMembers && orgMembers.length > 0) {
        for (const channel of createdPublicChannels) {
          const memberships = orgMembers
            .filter(member => member.user_id !== user.id) // Skip creator (already owner)
            .map(member => ({
              channel_id: channel.id,
              user_id: member.user_id,
              role: 'member' as const,
            }));

          if (memberships.length > 0) {
            await supabase
              .from('chat_channel_members')
              .upsert(memberships, { onConflict: 'channel_id,user_id' });
          }
        }

        // Auto-join members to location channels based on their assignments
        for (const locChannel of createdLocationChannels) {
          const locationMembers = orgMembers.filter(m => {
            if (m.user_id === user.id) return false; // Skip creator
            const memberLocations: string[] = [];
            if (m.location_ids && Array.isArray(m.location_ids) && m.location_ids.length > 0) {
              memberLocations.push(...m.location_ids);
            } else if (m.location_id) {
              memberLocations.push(m.location_id);
            }
            return memberLocations.includes(locChannel.location_id);
          });

          const memberships = locationMembers.map(member => ({
            channel_id: locChannel.id,
            user_id: member.user_id,
            role: 'member' as const,
          }));

          if (memberships.length > 0) {
            await supabase
              .from('chat_channel_members')
              .upsert(memberships, { onConflict: 'channel_id,user_id' });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
  });
}
