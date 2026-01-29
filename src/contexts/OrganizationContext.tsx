import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Organization } from '@/hooks/useOrganizations';

interface OrganizationContextValue {
  /** The user's own organization (detected from employee_profile) */
  currentOrganization: Organization | null;
  /** Platform user's manual override selection */
  selectedOrganization: Organization | null;
  /** The organization to use for queries (selected > current) */
  effectiveOrganization: Organization | null;
  /** Whether a platform user is viewing as a different org */
  isImpersonating: boolean;
  /** Set the organization override (for platform users) */
  setSelectedOrganization: (org: Organization | null) => void;
  /** Clear any org override */
  clearSelection: () => void;
  /** Loading state */
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, isPlatformUser } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // Fetch user's own organization from their employee_profile
  const { data: currentOrganization, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['user-organization', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // First get the user's org ID from their profile
      const { data: profile, error: profileError } = await supabase
        .from('employee_profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile org:', profileError);
        return null;
      }

      if (!profile?.organization_id) return null;

      // Now fetch the full organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        return null;
      }

      return org as Organization;
    },
    enabled: !!user?.id && !isPlatformUser,
  });

  // Clear selection when logging out
  useEffect(() => {
    if (!user) {
      setSelectedOrganization(null);
    }
  }, [user]);

  const clearSelection = useCallback(() => {
    setSelectedOrganization(null);
  }, []);

  // Compute effective organization
  const effectiveOrganization = useMemo(() => {
    // Platform users: use selection if set, otherwise null (platform-wide view)
    if (isPlatformUser) {
      return selectedOrganization;
    }
    // Regular users: always use their own organization
    return currentOrganization || null;
  }, [isPlatformUser, selectedOrganization, currentOrganization]);

  // Check if platform user is "impersonating" an org
  const isImpersonating = useMemo(() => {
    return isPlatformUser && selectedOrganization !== null;
  }, [isPlatformUser, selectedOrganization]);

  const value = useMemo(() => ({
    currentOrganization: currentOrganization || null,
    selectedOrganization,
    effectiveOrganization,
    isImpersonating,
    setSelectedOrganization,
    clearSelection,
    isLoading: isLoadingCurrent,
  }), [
    currentOrganization,
    selectedOrganization,
    effectiveOrganization,
    isImpersonating,
    clearSelection,
    isLoadingCurrent,
  ]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}
