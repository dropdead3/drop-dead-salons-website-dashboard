import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useEffectiveUserId } from './useEffectiveUser';
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

// Element definitions for auto-registration
export interface ElementDefinition {
  key: string;
  name: string;
  category: string;
  defaultVisible?: boolean; // Defaults to true if not specified
}

// Registry of all visibility-controlled elements in the app
export const VISIBILITY_ELEMENTS: ElementDefinition[] = [
  // Dashboard Home - Quick Actions
  { key: 'quick_actions', name: 'Quick Actions Section', category: 'Dashboard Home' },
  { key: 'ring_the_bell_action', name: 'Ring the Bell Button', category: 'Dashboard Home' },
  { key: 'log_metrics_action', name: 'Log Metrics Button', category: 'Dashboard Home' },
  { key: 'training_action', name: 'Training Button', category: 'Dashboard Home' },
  
  // Dashboard Home - Cards
  { key: 'sales_overview', name: 'Sales Overview', category: 'Dashboard Cards' },
  { key: 'quick_stats', name: 'Quick Stats', category: 'Dashboard Cards' },
  { key: 'todays_schedule', name: "Today's Schedule", category: 'Dashboard Cards' },
  { key: 'my_tasks', name: 'My Tasks', category: 'Dashboard Cards' },
  { key: 'announcements', name: 'Announcements', category: 'Dashboard Cards' },
  { key: 'client_engine', name: 'Client Engine', category: 'Dashboard Cards' },
  
  // Dashboard Home - Leadership Cards
  { key: 'website_analytics', name: 'Website Analytics', category: 'Leadership Cards' },
  { key: 'client_engine_overview', name: 'Client Engine Overview', category: 'Leadership Cards' },
  { key: 'onboarding_overview', name: 'Onboarding Overview', category: 'Leadership Cards' },
  { key: 'team_overview', name: 'Team Overview', category: 'Leadership Cards' },
  { key: 'stylists_overview', name: 'Stylists Overview', category: 'Leadership Cards' },
  
  // Sales Dashboard
  { key: 'sales_kpi_cards', name: 'KPI Cards', category: 'Sales Dashboard' },
  { key: 'sales_goal_progress', name: 'Goal Progress', category: 'Sales Dashboard' },
  { key: 'sales_historical_comparison', name: 'Historical Comparison', category: 'Sales Dashboard' },
  { key: 'sales_overview_tab', name: 'Overview Tab', category: 'Sales Dashboard' },
  { key: 'sales_stylist_tab', name: 'By Stylist Tab', category: 'Sales Dashboard' },
  { key: 'sales_location_tab', name: 'By Location Tab', category: 'Sales Dashboard' },
  { key: 'sales_phorest_tab', name: 'Phorest Staff Tab', category: 'Sales Dashboard' },
  { key: 'sales_compare_tab', name: 'Compare Tab', category: 'Sales Dashboard' },
  { key: 'sales_analytics_tab', name: 'Analytics Tab', category: 'Sales Dashboard' },
  { key: 'commission_calculator', name: 'Commission Calculator', category: 'Sales Dashboard' },
  
  // Team Overview
  { key: 'team_coach_notes', name: 'Coach Notes', category: 'Team Overview' },
  { key: 'team_weekly_wins', name: 'Weekly Wins', category: 'Team Overview' },
  { key: 'team_handbook_status', name: 'Handbook Status', category: 'Team Overview' },
  { key: 'team_quick_stats', name: 'Quick Stats', category: 'Team Overview' },
  
  // Client Engine Tracker
  { key: 'engine_stats_cards', name: 'Stats Cards', category: 'Client Engine Tracker' },
  { key: 'engine_pause_requests', name: 'Pause Requests', category: 'Client Engine Tracker' },
  { key: 'engine_participant_details', name: 'Participant Details', category: 'Client Engine Tracker' },
];

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

// Fetch visibility settings for the current user's roles (respects impersonation)
export function useMyDashboardVisibility() {
  const { roles: actualRoles } = useAuth();
  const { isViewingAsUser, viewAsRole } = useViewAs();
  const effectiveUserId = useEffectiveUserId();

  // Fetch roles and visibility in a single query that handles impersonation
  return useQuery({
    queryKey: ['dashboard-visibility', 'my', effectiveUserId, viewAsRole, isViewingAsUser, actualRoles],
    queryFn: async () => {
      let rolesToCheck: AppRole[] = actualRoles as AppRole[];

      // If viewing as a specific user, fetch their roles
      if (isViewingAsUser && effectiveUserId) {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', effectiveUserId);

        if (!rolesError && userRoles && userRoles.length > 0) {
          rolesToCheck = userRoles.map(r => r.role);
        }
      } else if (viewAsRole) {
        // If viewing as a role (not a specific user)
        rolesToCheck = [viewAsRole];
      }

      if (rolesToCheck.length === 0) return {};

      const { data, error } = await supabase
        .from('dashboard_element_visibility')
        .select('*')
        .in('role', rolesToCheck);

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
    enabled: actualRoles.length > 0 || isViewingAsUser || !!viewAsRole,
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

// Sync visibility elements - registers any missing elements for all roles
export function useSyncVisibilityElements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all active roles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('name')
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Get existing element-role combinations
      const { data: existing, error: existingError } = await supabase
        .from('dashboard_element_visibility')
        .select('element_key, role');

      if (existingError) throw existingError;

      const existingSet = new Set(
        (existing || []).map(e => `${e.element_key}:${e.role}`)
      );

      // Find missing combinations
      const toInsert: {
        element_key: string;
        element_name: string;
        element_category: string;
        role: AppRole;
        is_visible: boolean;
      }[] = [];

      for (const element of VISIBILITY_ELEMENTS) {
        for (const role of roles || []) {
          const key = `${element.key}:${role.name}`;
          if (!existingSet.has(key)) {
            toInsert.push({
              element_key: element.key,
              element_name: element.name,
              element_category: element.category,
              role: role.name as AppRole,
              is_visible: element.defaultVisible !== false,
            });
          }
        }
      }

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('dashboard_element_visibility')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      return { synced: toInsert.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-visibility'] });
      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} new visibility entries`);
      } else {
        toast.info('All visibility entries are up to date');
      }
    },
    onError: (error) => {
      toast.error('Failed to sync visibility elements', { description: error.message });
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

// Get all unique categories from the element registry
export function getElementCategories(): string[] {
  const categories = new Set(VISIBILITY_ELEMENTS.map(e => e.category));
  return Array.from(categories);
}
