import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CalendarThemeSettings {
  id: string;
  user_id: string;
  
  // Header/Banner colors
  header_bg_color: string;
  header_text_color: string;
  
  // Days row (weekday labels)
  days_row_bg_color: string;
  days_row_text_color: string;
  
  // Today highlight
  today_highlight_color: string;
  today_badge_bg_color: string;
  today_badge_text_color: string;
  
  // Cell styling
  cell_border_color: string;
  cell_border_style: 'solid' | 'dashed' | 'dotted' | 'none';
  cell_border_width: number;
  
  // Grid lines
  hour_line_color: string;
  half_hour_line_color: string;
  quarter_hour_line_color: string;
  
  // Current time indicator
  current_time_color: string;
  
  // General background
  calendar_bg_color: string;
  outside_month_bg_color: string;
  
  created_at: string;
  updated_at: string;
}

const DEFAULT_THEME: Omit<CalendarThemeSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  header_bg_color: '#1f2937',
  header_text_color: '#ffffff',
  days_row_bg_color: '#f3f4f6',
  days_row_text_color: '#6b7280',
  today_highlight_color: '#8b5cf6',
  today_badge_bg_color: '#1f2937',
  today_badge_text_color: '#ffffff',
  cell_border_color: '#e5e7eb',
  cell_border_style: 'solid',
  cell_border_width: 1,
  hour_line_color: '#d1d5db',
  half_hour_line_color: '#e5e7eb',
  quarter_hour_line_color: '#f3f4f6',
  current_time_color: '#ef4444',
  calendar_bg_color: '#ffffff',
  outside_month_bg_color: '#f9fafb',
};

// Preset themes
export const CALENDAR_THEME_PRESETS = {
  default: {
    name: 'Default',
    description: 'Clean and professional',
    ...DEFAULT_THEME,
  },
  midnight: {
    name: 'Midnight',
    description: 'Dark and elegant',
    header_bg_color: '#0f172a',
    header_text_color: '#f8fafc',
    days_row_bg_color: '#1e293b',
    days_row_text_color: '#94a3b8',
    today_highlight_color: '#6366f1',
    today_badge_bg_color: '#6366f1',
    today_badge_text_color: '#ffffff',
    cell_border_color: '#334155',
    cell_border_style: 'solid' as const,
    cell_border_width: 1,
    hour_line_color: '#475569',
    half_hour_line_color: '#334155',
    quarter_hour_line_color: '#1e293b',
    current_time_color: '#f43f5e',
    calendar_bg_color: '#0f172a',
    outside_month_bg_color: '#020617',
  },
  rose: {
    name: 'Rose',
    description: 'Soft and warm',
    header_bg_color: '#831843',
    header_text_color: '#fdf2f8',
    days_row_bg_color: '#fce7f3',
    days_row_text_color: '#9d174d',
    today_highlight_color: '#ec4899',
    today_badge_bg_color: '#db2777',
    today_badge_text_color: '#ffffff',
    cell_border_color: '#fbcfe8',
    cell_border_style: 'solid' as const,
    cell_border_width: 1,
    hour_line_color: '#f9a8d4',
    half_hour_line_color: '#fbcfe8',
    quarter_hour_line_color: '#fce7f3',
    current_time_color: '#e11d48',
    calendar_bg_color: '#fff1f2',
    outside_month_bg_color: '#ffe4e6',
  },
  ocean: {
    name: 'Ocean',
    description: 'Cool and calming',
    header_bg_color: '#164e63',
    header_text_color: '#ecfeff',
    days_row_bg_color: '#cffafe',
    days_row_text_color: '#155e75',
    today_highlight_color: '#06b6d4',
    today_badge_bg_color: '#0891b2',
    today_badge_text_color: '#ffffff',
    cell_border_color: '#a5f3fc',
    cell_border_style: 'solid' as const,
    cell_border_width: 1,
    hour_line_color: '#67e8f9',
    half_hour_line_color: '#a5f3fc',
    quarter_hour_line_color: '#cffafe',
    current_time_color: '#0284c7',
    calendar_bg_color: '#ecfeff',
    outside_month_bg_color: '#e0f2fe',
  },
  forest: {
    name: 'Forest',
    description: 'Natural and fresh',
    header_bg_color: '#14532d',
    header_text_color: '#f0fdf4',
    days_row_bg_color: '#dcfce7',
    days_row_text_color: '#166534',
    today_highlight_color: '#22c55e',
    today_badge_bg_color: '#16a34a',
    today_badge_text_color: '#ffffff',
    cell_border_color: '#bbf7d0',
    cell_border_style: 'solid' as const,
    cell_border_width: 1,
    hour_line_color: '#86efac',
    half_hour_line_color: '#bbf7d0',
    quarter_hour_line_color: '#dcfce7',
    current_time_color: '#dc2626',
    calendar_bg_color: '#f0fdf4',
    outside_month_bg_color: '#dcfce7',
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm and vibrant',
    header_bg_color: '#7c2d12',
    header_text_color: '#fff7ed',
    days_row_bg_color: '#ffedd5',
    days_row_text_color: '#9a3412',
    today_highlight_color: '#f97316',
    today_badge_bg_color: '#ea580c',
    today_badge_text_color: '#ffffff',
    cell_border_color: '#fed7aa',
    cell_border_style: 'solid' as const,
    cell_border_width: 1,
    hour_line_color: '#fdba74',
    half_hour_line_color: '#fed7aa',
    quarter_hour_line_color: '#ffedd5',
    current_time_color: '#dc2626',
    calendar_bg_color: '#fff7ed',
    outside_month_bg_color: '#ffedd5',
  },
};

export function useCalendarTheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: theme, isLoading } = useQuery({
    queryKey: ['calendar-theme', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_theme_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create default theme
        const { data: newTheme, error: insertError } = await supabase
          .from('calendar_theme_settings')
          .insert({ user_id: user!.id, ...DEFAULT_THEME })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newTheme as CalendarThemeSettings;
      }
      
      return data as CalendarThemeSettings;
    },
  });

  const updateTheme = useMutation({
    mutationFn: async (updates: Partial<Omit<CalendarThemeSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase
        .from('calendar_theme_settings')
        .update(updates)
        .eq('user_id', user!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CalendarThemeSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['calendar-theme', user?.id], data);
    },
    onError: (error: Error) => {
      toast.error('Failed to save theme', { description: error.message });
    },
  });

  const applyPreset = useMutation({
    mutationFn: async (presetKey: keyof typeof CALENDAR_THEME_PRESETS) => {
      const preset = CALENDAR_THEME_PRESETS[presetKey];
      const { name, description, ...settings } = preset;
      
      const { data, error } = await supabase
        .from('calendar_theme_settings')
        .update(settings)
        .eq('user_id', user!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CalendarThemeSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['calendar-theme', user?.id], data);
      toast.success('Theme applied');
    },
    onError: (error: Error) => {
      toast.error('Failed to apply theme', { description: error.message });
    },
  });

  const resetToDefault = () => {
    applyPreset.mutate('default');
  };

  return {
    theme: theme ?? { ...DEFAULT_THEME, id: '', user_id: user?.id ?? '' } as CalendarThemeSettings,
    isLoading,
    updateTheme: updateTheme.mutate,
    applyPreset: applyPreset.mutate,
    resetToDefault,
    isUpdating: updateTheme.isPending || applyPreset.isPending,
  };
}
