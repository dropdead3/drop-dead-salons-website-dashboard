import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Default section order matching the sidebar structure
export const DEFAULT_SECTION_ORDER = [
  'main',
  'growth', 
  'stats',
  'getHelp',
  'housekeeping',
  'manager',
  'website',
  'adminOnly',
];

// Section labels for display
export const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  growth: 'Growth',
  stats: 'Stats & Leaderboard',
  getHelp: 'Get Help',
  housekeeping: 'Housekeeping',
  manager: 'Management',
  website: 'Website',
  adminOnly: 'Super Admin',
};

// Default link order for each section
export const DEFAULT_LINK_ORDER: Record<string, string[]> = {
  main: [
    '/dashboard',
    '/dashboard/schedule',
    '/dashboard/directory',
  ],
  growth: [
    '/dashboard/training',
    '/dashboard/program',
    '/dashboard/admin/team',
    '/dashboard/ring-the-bell',
    '/dashboard/my-graduation',
  ],
  stats: [
    '/dashboard/stats',
    '/dashboard/my-clients',
    '/dashboard/leaderboard',
    '/dashboard/admin/sales',
    '/dashboard/admin/operational-analytics',
    '/dashboard/admin/staff-utilization',
  ],
  getHelp: [
    '/dashboard/assistant-schedule',
    '/dashboard/schedule-meeting',
  ],
  housekeeping: [
    '/dashboard/onboarding',
    '/dashboard/handbooks',
  ],
  manager: [
    '/dashboard/admin/birthdays',
    '/dashboard/admin/onboarding-tracker',
    '/dashboard/admin/client-engine-tracker',
    '/dashboard/admin/recruiting',
    '/dashboard/admin/graduation-tracker',
    '/dashboard/admin/assistant-requests',
    '/dashboard/admin/strikes',
    '/dashboard/admin/business-cards',
    '/dashboard/admin/headshots',
    '/dashboard/admin/announcements',
  ],
  website: [
    '/dashboard/admin/homepage-stylists',
    '/dashboard/admin/testimonials',
    '/dashboard/admin/gallery',
    '/dashboard/admin/services',
    '/dashboard/admin/locations',
  ],
  adminOnly: [
    '/dashboard/admin/accounts',
    '/dashboard/admin/roles',
    '/dashboard/admin/settings',
  ],
};

export interface SidebarLayoutConfig {
  sectionOrder: string[];
  linkOrder: Record<string, string[]>;
  hiddenSections: string[];
  hiddenLinks: Record<string, string[]>;
}

export function useSidebarLayout() {
  return useQuery({
    queryKey: ['sidebar-layout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('sidebar_layout')
        .single();

      if (error) throw error;

      const stored = data?.sidebar_layout as unknown as SidebarLayoutConfig | null;
      
      // Merge stored with defaults
      const sectionOrder = stored?.sectionOrder?.length 
        ? [...new Set([...stored.sectionOrder, ...DEFAULT_SECTION_ORDER])]
        : DEFAULT_SECTION_ORDER;

      const linkOrder: Record<string, string[]> = { ...DEFAULT_LINK_ORDER };
      
      if (stored?.linkOrder) {
        Object.keys(stored.linkOrder).forEach((sectionId) => {
          const storedLinks = stored.linkOrder[sectionId];
          const defaultLinks = DEFAULT_LINK_ORDER[sectionId] || [];
          // Merge stored with any new defaults
          linkOrder[sectionId] = [...new Set([...storedLinks, ...defaultLinks])];
        });
      }

      // Hidden sections and links default to empty arrays
      const hiddenSections = stored?.hiddenSections || [];
      const hiddenLinks = stored?.hiddenLinks || {};

      return { sectionOrder, linkOrder, hiddenSections, hiddenLinks } as SidebarLayoutConfig;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

export function useUpdateSidebarLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: SidebarLayoutConfig) => {
      // Get existing settings first
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id')
        .single();

      if (!existing) {
        throw new Error('Business settings not found');
      }

      // Convert to JSON-compatible type for Supabase using JSON serialization
      const layoutJson = JSON.parse(JSON.stringify({
        sectionOrder: layout.sectionOrder,
        linkOrder: layout.linkOrder,
        hiddenSections: layout.hiddenSections,
        hiddenLinks: layout.hiddenLinks,
      }));

      const { data, error } = await supabase
        .from('business_settings')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ sidebar_layout: layoutJson } as any)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-layout'] });
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success('Sidebar layout saved');
    },
    onError: (error) => {
      console.error('Failed to update sidebar layout:', error);
      toast.error('Failed to update sidebar layout');
    },
  });
}
