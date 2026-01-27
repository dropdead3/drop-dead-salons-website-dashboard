import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Default icon colors for each category
export const DEFAULT_ICON_COLORS: Record<string, string> = {
  business: '#D946EF',   // Fuchsia
  email: '#8B5CF6',      // Purple
  sms: '#22C55E',        // Green for text messages
  'service-flows': '#A855F7', // Purple (for service communication flows)
  users: '#3B82F6',      // Blue
  onboarding: '#F97316', // Orange
  integrations: '#10B981', // Emerald
  system: '#6B7280',     // Gray
  program: '#EC4899',    // Pink
  levels: '#14B8A6',     // Teal
  handbooks: '#EAB308',  // Yellow
  visibility: '#6366F1', // Indigo
  schedule: '#0EA5E9',   // Sky blue
  locations: '#EF4444',  // Red
  dayrate: '#F97316',    // Orange (chair rental)
  'role-access': '#8B5CF6', // Purple (Shield icon theme)
  forms: '#0EA5E9',      // Sky blue (Forms & Agreements)
};

// Section groups for organized layout
export const SECTION_GROUPS = [
  {
    id: 'operations',
    label: 'Business Operations',
    categories: ['business', 'locations', 'schedule', 'dayrate', 'forms', 'levels', 'onboarding', 'handbooks'],
  },
  {
    id: 'team',
    label: 'Access & Visibility',
    categories: ['users', 'role-access', 'visibility'],
  },
  {
    id: 'custom-programs',
    label: 'Custom Programs',
    categories: ['program'],
  },
  {
    id: 'platform',
    label: 'Platform',
    categories: ['system', 'integrations'],
  },
  {
    id: 'communications',
    label: 'Communications',
    categories: ['email', 'sms', 'service-flows'],
  },
];

// Default order (derived from section groups)
export const DEFAULT_ORDER = SECTION_GROUPS.flatMap(section => section.categories);

interface SettingsLayoutPreferences {
  order: string[];
  iconColors: Record<string, string>;
}

export function useSettingsLayout() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['settings-layout', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('settings_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings layout:', error);
      }

      // Return stored preferences or defaults
      const stored = data?.settings_layout as unknown as SettingsLayoutPreferences | null;
      
      // Merge stored order with defaults to include any new categories
      let order = stored?.order || DEFAULT_ORDER;
      // Add any new categories from DEFAULT_ORDER that aren't in stored order
      const missingCategories = DEFAULT_ORDER.filter(cat => !order.includes(cat));
      if (missingCategories.length > 0) {
        order = [...missingCategories, ...order];
      }
      
      return {
        order,
        iconColors: { ...DEFAULT_ICON_COLORS, ...(stored?.iconColors || {}) },
      };
    },
    enabled: !!user?.id,
  });
}

export function useUpdateSettingsLayout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: SettingsLayoutPreferences) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ settings_layout: preferences as any })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, settings_layout: preferences as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-layout', user?.id] });
    },
  });
}
