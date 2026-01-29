import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Organization } from './useOrganizations';

export interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  onboardingOrganizations: number;
  pendingMigrations: number;
  totalLocations: number;
  totalUsers: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'org_created' | 'migration_completed' | 'status_change' | 'user_added';
  description: string;
  organizationName?: string;
  createdAt: string;
}

export function useOrganizationStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const [orgsResult, locationsResult, usersResult, importsResult] = await Promise.all([
        supabase.from('organizations' as never).select('id, status, onboarding_stage, name, created_at'),
        supabase.from('locations').select('id', { count: 'exact' }),
        supabase.from('employee_profiles').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('import_jobs').select('id, status, organization_id'),
      ]);

      const organizations = (orgsResult.data || []) as unknown as Organization[];
      const activeOrgs = organizations.filter(o => o.status === 'active');
      const onboardingOrgs = organizations.filter(o => 
        o.status === 'pending' || 
        (o.onboarding_stage && o.onboarding_stage !== 'live')
      );
      
      const imports = (importsResult.data || []) as unknown as { id: string; status: string; organization_id: string }[];
      const pendingMigrations = imports.filter(
        j => j.status === 'processing' || j.status === 'pending'
      ).length;

      // Build recent activity from organizations created
      const recentActivity: ActivityItem[] = organizations
        .slice(0, 5)
        .map(org => ({
          id: org.id,
          type: 'org_created' as const,
          description: `New salon account created`,
          organizationName: org.name,
          createdAt: org.created_at,
        }));

      return {
        totalOrganizations: organizations.length,
        activeOrganizations: activeOrgs.length,
        onboardingOrganizations: onboardingOrgs.length,
        pendingMigrations,
        totalLocations: locationsResult.count || 0,
        totalUsers: usersResult.count || 0,
        recentActivity,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useOrganizationsByStatus(status?: string) {
  return useQuery({
    queryKey: ['organizations-by-status', status],
    queryFn: async () => {
      let query = supabase.from('organizations' as never).select('*');
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Organization[];
    },
  });
}
