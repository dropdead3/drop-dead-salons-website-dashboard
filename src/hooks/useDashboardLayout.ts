import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveRoles } from './useEffectiveUser';
import { toast } from 'sonner';

export interface DashboardLayout {
  sections: string[];
  sectionOrder: string[];  // All sections in display order (enabled + disabled)
  pinnedCards: string[];
  widgets: string[];
  hasCompletedSetup: boolean;
}

export interface DashboardTemplate {
  id: string;
  role_name: string;
  display_name: string;
  description: string | null;
  layout: DashboardLayout;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  sections: ['quick_actions', 'command_center', 'operations_stats', 'todays_queue', 'quick_stats', 'schedule_tasks', 'announcements', 'client_engine', 'widgets'],
  sectionOrder: ['quick_actions', 'command_center', 'operations_stats', 'todays_queue', 'quick_stats', 'schedule_tasks', 'announcements', 'client_engine', 'widgets'],
  pinnedCards: [],
  widgets: ['changelog', 'birthdays', 'anniversaries', 'schedule'],
  hasCompletedSetup: false,
};

// Map roles to template role_name
function getRoleTemplateKey(roles: string[], isLeadership: boolean): string {
  if (isLeadership) return 'leadership';
  if (roles.includes('stylist')) return 'stylist';
  if (roles.includes('stylist_assistant')) return 'assistant';
  if (roles.includes('receptionist')) return 'operations';
  return 'stylist'; // Default fallback
}

// Fetch all available templates
export function useDashboardTemplates() {
  return useQuery({
    queryKey: ['dashboard-layout-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layout_templates')
        .select('*')
        .order('display_name');

      if (error) throw error;
      
      return (data || []).map(template => ({
        ...template,
        layout: template.layout as unknown as DashboardLayout,
      })) as DashboardTemplate[];
    },
  });
}

// Fetch user's dashboard layout
export function useDashboardLayout() {
  const { user } = useAuth();
  const roles = useEffectiveRoles();

  const { data: userPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('dashboard_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Determine if user is leadership for template selection
  const isLeadership = roles.includes('super_admin') || roles.includes('manager');
  const templateKey = getRoleTemplateKey(roles, isLeadership);

  const { data: roleTemplate, isLoading: templateLoading } = useQuery({
    queryKey: ['dashboard-layout-template', templateKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layout_templates')
        .select('*')
        .eq('role_name', templateKey)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          layout: data.layout as unknown as DashboardLayout,
        } as DashboardTemplate;
      }
      return null;
    },
    enabled: roles.length > 0,
  });

  // Determine the effective layout - safely parse JSON
  const parsedLayout = userPrefs?.dashboard_layout as Record<string, unknown> | null;
  const savedLayout: DashboardLayout | null = parsedLayout ? {
    sections: (parsedLayout.sections as string[]) || [],
    sectionOrder: (parsedLayout.sectionOrder as string[]) || (parsedLayout.sections as string[]) || [],
    pinnedCards: (parsedLayout.pinnedCards as string[]) || [],
    widgets: (parsedLayout.widgets as string[]) || [],
    hasCompletedSetup: (parsedLayout.hasCompletedSetup as boolean) || false,
  } : null;
  
  const hasCompletedSetup = savedLayout?.hasCompletedSetup ?? false;
  
  // Use saved layout if exists, otherwise use role template, otherwise default
  const layout: DashboardLayout = savedLayout || 
    (roleTemplate?.layout ? { ...roleTemplate.layout, sectionOrder: roleTemplate.layout.sectionOrder || roleTemplate.layout.sections, hasCompletedSetup: false } : DEFAULT_LAYOUT);

  return {
    layout,
    hasCompletedSetup,
    isLoading: prefsLoading || templateLoading,
    roleTemplate,
    templateKey,
    isLeadership,
  };
}

// Save dashboard layout
export function useSaveDashboardLayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: DashboardLayout) => {
      if (!user?.id) throw new Error('User not authenticated');

      const layoutJson = {
        sections: layout.sections,
        sectionOrder: layout.sectionOrder,
        pinnedCards: layout.pinnedCards,
        widgets: layout.widgets,
        hasCompletedSetup: layout.hasCompletedSetup,
      };

      // First check if user preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({ dashboard_layout: layoutJson })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ 
            user_id: user.id, 
            dashboard_layout: layoutJson,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
    onError: (error) => {
      toast.error('Failed to save dashboard layout', { description: error.message });
    },
  });
}

// Update specific parts of layout
export function useUpdateDashboardLayout() {
  const { layout } = useDashboardLayout();
  const saveMutation = useSaveDashboardLayout();

  return useMutation({
    mutationFn: async (updates: Partial<DashboardLayout>) => {
      const newLayout = { ...layout, ...updates };
      await saveMutation.mutateAsync(newLayout);
    },
  });
}

// Complete setup with a specific template
export function useCompleteSetup() {
  const saveMutation = useSaveDashboardLayout();

  return useMutation({
    mutationFn: async (templateLayout?: DashboardLayout) => {
      const layout = templateLayout ? 
        { ...templateLayout, hasCompletedSetup: true } : 
        { ...DEFAULT_LAYOUT, hasCompletedSetup: true };
      
      await saveMutation.mutateAsync(layout);
    },
    onSuccess: () => {
      toast.success('Dashboard setup complete!');
    },
  });
}

// Reset to role default template
export function useResetToDefault() {
  const { roleTemplate } = useDashboardLayout();
  const saveMutation = useSaveDashboardLayout();

  return useMutation({
    mutationFn: async () => {
      if (!roleTemplate?.layout) {
        throw new Error('No default template found');
      }
      
      await saveMutation.mutateAsync({ 
        ...roleTemplate.layout, 
        hasCompletedSetup: true 
      });
    },
    onSuccess: () => {
      toast.success('Dashboard reset to default');
    },
  });
}

// Toggle a section visibility
export function useToggleSection() {
  const { layout } = useDashboardLayout();
  const saveMutation = useSaveDashboardLayout();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      const sections = layout.sections.includes(sectionId)
        ? layout.sections.filter(s => s !== sectionId)
        : [...layout.sections, sectionId];
      
      await saveMutation.mutateAsync({ ...layout, sections });
    },
  });
}

// Toggle a widget
export function useToggleWidget() {
  const { layout } = useDashboardLayout();
  const saveMutation = useSaveDashboardLayout();

  return useMutation({
    mutationFn: async (widgetId: string) => {
      const widgets = layout.widgets.includes(widgetId)
        ? layout.widgets.filter(w => w !== widgetId)
        : [...layout.widgets, widgetId];
      
      await saveMutation.mutateAsync({ ...layout, widgets });
    },
  });
}
