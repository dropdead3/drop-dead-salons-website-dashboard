import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomepageStylistsSettings {
  show_sample_cards: boolean;
}

type SiteSettingValue = HomepageStylistsSettings | Record<string, unknown>;

export function useSiteSettings<T extends SiteSettingValue = SiteSettingValue>(key: string) {
  return useQuery({
    queryKey: ['site-settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', key)
        .single();

      if (error) {
        // If setting doesn't exist, return null
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data?.value as T | null;
    },
  });
}

export function useUpdateSiteSetting<T extends SiteSettingValue = SiteSettingValue>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: T }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          value: value as never,
          updated_by: user?.id 
        })
        .eq('id', key);

      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', key] });
    },
  });
}

// Typed hook specifically for homepage stylists settings
export function useHomepageStylistsSettings() {
  return useSiteSettings<HomepageStylistsSettings>('homepage_stylists');
}

export function useUpdateHomepageStylistsSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: HomepageStylistsSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          value: value as never,
          updated_by: user?.id 
        })
        .eq('id', 'homepage_stylists');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'homepage_stylists'] });
    },
  });
}
