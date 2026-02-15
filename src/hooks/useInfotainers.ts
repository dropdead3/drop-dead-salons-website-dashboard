import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

const DISMISSED_PREFIX = 'infotainer-dismissed-';

/** Check if a specific infotainer should be visible */
export function useInfotainerVisible(id: string) {
  const { showInfotainers, isLoading } = useInfotainerSettings();

  const isDismissed = useMemo(() => {
    try {
      return localStorage.getItem(`${DISMISSED_PREFIX}${id}`) === 'true';
    } catch {
      return false;
    }
  }, [id]);

  return {
    isVisible: !isLoading && showInfotainers && !isDismissed,
    isLoading,
  };
}

/** Dismiss a specific infotainer (persisted to localStorage) */
export function useDismissInfotainer() {
  return useCallback((id: string) => {
    try {
      localStorage.setItem(`${DISMISSED_PREFIX}${id}`, 'true');
    } catch {
      // localStorage unavailable
    }
  }, []);
}

/** Get and set the org-level show_infotainers toggle */
export function useInfotainerSettings() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;
  const queryClient = useQueryClient();

  const { data: showInfotainers = true, isLoading } = useQuery({
    queryKey: ['infotainer-settings', orgId],
    queryFn: async () => {
      if (!orgId) return true;
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();
      if (error) return true;
      const settings = data?.settings as Record<string, unknown> | null;
      return settings?.show_infotainers !== false; // default true
    },
    enabled: !!orgId,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!orgId) throw new Error('No organization');
      // Fetch current settings first
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();
      const currentSettings = (org?.settings as Record<string, unknown>) || {};
      const newSettings = { ...currentSettings, show_infotainers: enabled };
      const { error } = await supabase
        .from('organizations')
        .update({ settings: newSettings })
        .eq('id', orgId);
      if (error) throw error;

      // If turning back on, clear all localStorage dismissals
      if (enabled) {
        clearAllDismissals();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infotainer-settings', orgId] });
    },
  });

  return {
    showInfotainers,
    isLoading,
    toggleInfotainers: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}

function clearAllDismissals() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(DISMISSED_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // localStorage unavailable
  }
}
