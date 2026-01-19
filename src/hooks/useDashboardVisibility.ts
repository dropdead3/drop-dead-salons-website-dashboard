import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface DashboardElementVisibility {
  id: string;
  element_key: string;
  element_name: string;
  element_category: string;
  role: AppRole;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all visibility settings
export function useDashboardVisibility() {
  return useQuery({
    queryKey: ['dashboard-visibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_element_visibility')
        .select('*')
        .order('element_category')
        .order('element_name');

      if (error) throw error;
      return data as DashboardElementVisibility[];
    },
  });
}

// Fetch visibility settings for the current user's roles
export function useMyDashboardVisibility() {
  const { roles } = useAuth();

  return useQuery({
    queryKey: ['dashboard-visibility', 'my', roles],
    queryFn: async () => {
      if (!roles || roles.length === 0) return {};

      const { data, error } = await supabase
        .from('dashboard_element_visibility')
        .select('*')
        .in('role', roles);

      if (error) throw error;

      // Create a map of element_key -> is_visible (true if ANY of user's roles has it visible)
      const visibilityMap: Record<string, boolean> = {};
      
      (data as DashboardElementVisibility[]).forEach((item) => {
        if (visibilityMap[item.element_key] === undefined) {
          visibilityMap[item.element_key] = item.is_visible;
        } else {
          // If any role has it visible, show it
          visibilityMap[item.element_key] = visibilityMap[item.element_key] || item.is_visible;
        }
      });

      return visibilityMap;
    },
    enabled: roles.length > 0,
  });
}

// Toggle visibility for a specific element and role
export function useToggleDashboardVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ elementKey, role, isVisible }: { elementKey: string; role: AppRole; isVisible: boolean }) => {
      const { error } = await supabase
        .from('dashboard_element_visibility')
        .update({ is_visible: isVisible })
        .eq('element_key', elementKey)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-visibility'] });
    },
    onError: (error) => {
      toast.error('Failed to update visibility', { description: error.message });
    },
  });
}

// Bulk update visibility for multiple elements/roles
export function useBulkUpdateVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { elementKey: string; role: AppRole; isVisible: boolean }[]) => {
      // Process updates one by one (Supabase doesn't support bulk upsert with different values easily)
      for (const update of updates) {
        const { error } = await supabase
          .from('dashboard_element_visibility')
          .update({ is_visible: update.isVisible })
          .eq('element_key', update.elementKey)
          .eq('role', update.role);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-visibility'] });
      toast.success('Visibility settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update visibility settings', { description: error.message });
    },
  });
}

// Group visibility settings by category and element
export function groupVisibilityByElement(data: DashboardElementVisibility[]) {
  const grouped: Record<string, {
    element_key: string;
    element_name: string;
    element_category: string;
    roles: Record<AppRole, boolean>;
  }> = {};

  data.forEach((item) => {
    if (!grouped[item.element_key]) {
      grouped[item.element_key] = {
        element_key: item.element_key,
        element_name: item.element_name,
        element_category: item.element_category,
        roles: {} as Record<AppRole, boolean>,
      };
    }
    grouped[item.element_key].roles[item.role] = item.is_visible;
  });

  return Object.values(grouped);
}

// Group by category
export function groupByCategory(elements: ReturnType<typeof groupVisibilityByElement>) {
  const categories: Record<string, typeof elements> = {};

  elements.forEach((element) => {
    if (!categories[element.element_category]) {
      categories[element.element_category] = [];
    }
    categories[element.element_category].push(element);
  });

  return categories;
}
