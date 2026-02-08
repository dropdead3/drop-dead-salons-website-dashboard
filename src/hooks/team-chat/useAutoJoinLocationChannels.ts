import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useRef } from 'react';

/**
 * Hook that automatically joins the current user to channels they should have access to:
 * - All public channels (company-wide, general)
 * - Location channels matching their assigned locations
 */
export function useAutoJoinLocationChannels() {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  return useMutation({
    mutationFn: async () => {
      // Prevent duplicate runs
      if (hasRun.current) return;
      if (!user?.id || !effectiveOrganization?.id) return;

      hasRun.current = true;

      // 1. Get user's assigned location IDs from profile
      const locationIds: string[] = [];
      if (profile?.location_ids && Array.isArray(profile.location_ids) && profile.location_ids.length > 0) {
        locationIds.push(...profile.location_ids);
      } else if (profile?.location_id) {
        locationIds.push(profile.location_id);
      }

      // 2. Get all public + location channels for the org
      const { data: channels, error: channelsError } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_archived', false)
        .in('type', ['public', 'location']);

      if (channelsError) {
        console.error('Failed to fetch channels for auto-join:', channelsError);
        hasRun.current = false;
        return;
      }

      // 3. Get user's current memberships
      const { data: existingMemberships, error: memberError } = await supabase
        .from('chat_channel_members')
        .select('channel_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Failed to fetch memberships:', memberError);
        hasRun.current = false;
        return;
      }

      const memberChannelIds = new Set(existingMemberships?.map(m => m.channel_id) || []);

      // 4. Determine which channels to join
      const channelsToJoin = channels?.filter(channel => {
        // Skip if already a member
        if (memberChannelIds.has(channel.id)) return false;
        
        // Join all public channels
        if (channel.type === 'public') return true;
        
        // Join location channels matching user's assignments
        if (channel.type === 'location' && channel.location_id) {
          return locationIds.includes(channel.location_id);
        }
        
        return false;
      }) || [];

      // 5. Batch insert memberships
      if (channelsToJoin.length > 0) {
        const { error: insertError } = await supabase
          .from('chat_channel_members')
          .insert(channelsToJoin.map(ch => ({
            channel_id: ch.id,
            user_id: user.id,
            role: 'member' as const,
          })));

        if (insertError) {
          console.error('Failed to auto-join channels:', insertError);
          hasRun.current = false;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
    onError: () => {
      hasRun.current = false;
    },
  });
}
