import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings, useUpdateSiteSetting } from './useSiteSettings';

// Theme definition from database
export interface WebsiteTheme {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  color_scheme: string;
  typography_preset: Record<string, string>;
  layout_config: Record<string, string>;
  default_sections: Record<string, unknown>;
  is_builtin: boolean;
  is_available: boolean;
  created_at: string;
}

// Active theme setting stored in site_settings
export interface ActiveThemeSetting {
  [key: string]: unknown;
  theme_id: string;
  activated_at: string;
  customized: boolean;
}

// Fetch all themes from the website_themes table
export function useWebsiteThemes() {
  return useQuery({
    queryKey: ['website-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_themes')
        .select('*')
        .order('is_available', { ascending: false })
        .order('name');

      if (error) throw error;
      return (data ?? []) as unknown as WebsiteTheme[];
    },
  });
}

// Read active theme from site_settings
export function useActiveTheme() {
  return useSiteSettings<ActiveThemeSetting>('website_active_theme');
}

// Activate a theme
export function useActivateTheme() {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateSiteSetting<ActiveThemeSetting>();

  return useMutation({
    mutationFn: async (themeId: string) => {
      const value: ActiveThemeSetting = {
        theme_id: themeId,
        activated_at: new Date().toISOString(),
        customized: false,
      };

      await updateSetting.mutateAsync({ key: 'website_active_theme', value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'website_active_theme'] });
      queryClient.invalidateQueries({ queryKey: ['website-themes'] });
    },
  });
}
