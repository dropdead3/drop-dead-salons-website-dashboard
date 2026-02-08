import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatLayoutPreferences {
  sections_order: string[]; // Section IDs in order
  channels_order: Record<string, string[]>; // sectionId -> channelIds in order
  collapsed_sections: string[]; // Section IDs that are collapsed
}

const DEFAULT_PREFERENCES: ChatLayoutPreferences = {
  sections_order: [],
  channels_order: {},
  collapsed_sections: [],
};

export function useChatLayoutPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: preferences = DEFAULT_PREFERENCES, isLoading } = useQuery({
    queryKey: ['chat-layout-preferences', userId],
    queryFn: async () => {
      if (!userId) return DEFAULT_PREFERENCES;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('chat_layout')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences yet
          return DEFAULT_PREFERENCES;
        }
        throw error;
      }

      // Safely parse chat_layout with fallbacks
      const layout = data?.chat_layout;
      if (layout && typeof layout === 'object' && !Array.isArray(layout)) {
        return {
          sections_order: Array.isArray((layout as Record<string, unknown>).sections_order)
            ? ((layout as Record<string, unknown>).sections_order as string[])
            : [],
          channels_order: (layout as Record<string, unknown>).channels_order as Record<string, string[]> ?? {},
          collapsed_sections: Array.isArray((layout as Record<string, unknown>).collapsed_sections)
            ? ((layout as Record<string, unknown>).collapsed_sections as string[])
            : [],
        };
      }
      return DEFAULT_PREFERENCES;
    },
    enabled: !!userId,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<ChatLayoutPreferences>) => {
      if (!userId) throw new Error('Not authenticated');

      const newPrefs = { ...preferences, ...updates };

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ chat_layout: newPrefs as unknown as null })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            chat_layout: newPrefs as unknown as null,
          });
        if (error) throw error;
      }

      return newPrefs;
    },
    onSuccess: (newPrefs) => {
      queryClient.setQueryData(['chat-layout-preferences', userId], newPrefs);
    },
  });

  const setSectionsOrder = (sectionIds: string[]) => {
    updatePreferences.mutate({ sections_order: sectionIds });
  };

  const setChannelsOrder = (sectionId: string, channelIds: string[]) => {
    const newChannelsOrder = { ...preferences.channels_order, [sectionId]: channelIds };
    updatePreferences.mutate({ channels_order: newChannelsOrder });
  };

  const toggleSectionCollapsed = (sectionId: string) => {
    const collapsed = preferences.collapsed_sections || [];
    const isCollapsed = collapsed.includes(sectionId);
    const newCollapsed = isCollapsed
      ? collapsed.filter(id => id !== sectionId)
      : [...collapsed, sectionId];
    updatePreferences.mutate({ collapsed_sections: newCollapsed });
  };

  const isSectionCollapsed = (sectionId: string): boolean => {
    return (preferences.collapsed_sections || []).includes(sectionId);
  };

  return {
    preferences,
    isLoading,
    setSectionsOrder,
    setChannelsOrder,
    toggleSectionCollapsed,
    isSectionCollapsed,
    isUpdating: updatePreferences.isPending,
  };
}
