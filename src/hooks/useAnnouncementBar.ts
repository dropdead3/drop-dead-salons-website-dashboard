import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnnouncementBarSettings {
  enabled: boolean;
  message_prefix: string;
  message_highlight: string;
  message_suffix: string;
  cta_text: string;
  cta_url: string;
  open_in_new_tab: boolean;
}

const DEFAULT_SETTINGS: AnnouncementBarSettings = {
  enabled: true,
  message_prefix: 'Are you a salon',
  message_highlight: 'professional',
  message_suffix: 'looking for our extensions?',
  cta_text: 'Shop Our Extensions Here',
  cta_url: 'https://dropdeadextensions.com',
  open_in_new_tab: true,
};

export function useAnnouncementBarSettings() {
  return useQuery({
    queryKey: ['site-settings', 'announcement_bar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'announcement_bar')
        .maybeSingle();

      if (error) throw error;
      
      // Return default settings if no entry exists
      if (!data?.value) return DEFAULT_SETTINGS;
      
      return data.value as unknown as AnnouncementBarSettings;
    },
  });
}

export function useUpdateAnnouncementBarSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: AnnouncementBarSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to update first
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('id', 'announcement_bar')
        .maybeSingle();

      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            value: value as never,
            updated_by: user?.id 
          })
          .eq('id', 'announcement_bar');

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            id: 'announcement_bar',
            value: value as never,
            updated_by: user?.id 
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'announcement_bar'] });
    },
  });
}
