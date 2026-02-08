import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function useDMChannels() {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  const createDMMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id || !effectiveOrganization?.id) {
        throw new Error('Not authenticated');
      }

      // Check if DM channel already exists between these users
      const { data: existingChannels } = await supabase
        .from('chat_channels')
        .select(`
          id,
          chat_channel_members!inner (user_id)
        `)
        .eq('type', 'dm')
        .eq('organization_id', effectiveOrganization.id);

      // Find a DM channel that has exactly both users
      const existingDM = existingChannels?.find((channel) => {
        const members = (channel.chat_channel_members as any[]).map((m) => m.user_id);
        return members.length === 2 && members.includes(user.id) && members.includes(targetUserId);
      });

      if (existingDM) {
        return existingDM;
      }

      // Get target user's profile for channel name
      const { data: targetProfile } = await supabase
        .from('employee_profiles')
        .select('display_name, full_name')
        .eq('user_id', targetUserId)
        .single();

      const targetName = targetProfile?.display_name || targetProfile?.full_name || 'Unknown';

      // Create new DM channel
      const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert({
          name: `dm-${Date.now()}`, // Internal name, UI shows user names
          type: 'dm',
          organization_id: effectiveOrganization.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add both users as members
      const { error: membersError } = await supabase
        .from('chat_channel_members')
        .insert([
          { channel_id: channel.id, user_id: user.id, role: 'owner' },
          { channel_id: channel.id, user_id: targetUserId, role: 'member' },
        ]);

      if (membersError) throw membersError;

      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
    onError: (error) => {
      console.error('Failed to create DM:', error);
      toast.error('Failed to start conversation');
    },
  });

  return {
    createDM: createDMMutation.mutateAsync,
    isCreating: createDMMutation.isPending,
  };
}
