/**
 * POS Data Hook
 * 
 * Provides access to the appropriate POS adapter based on the
 * organization's configured POS system.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { createPhorestAdapter } from '@/adapters/phorest-adapter';
import { supabase } from '@/integrations/supabase/client';
import type { POSAdapter, POSType, POSConfig } from '@/types/pos';

// Create adapters for each supported POS type
const adapterFactories: Record<POSType, (orgId: string) => POSAdapter> = {
  phorest: createPhorestAdapter,
  // Future adapters will be added here:
  square: createPhorestAdapter, // Fallback until implemented
  boulevard: createPhorestAdapter, // Fallback until implemented
  zenoti: createPhorestAdapter, // Fallback until implemented
  manual: createPhorestAdapter, // Manual mode uses same local data structure
};

/**
 * Fetch POS configuration for an organization
 */
async function fetchPOSConfig(organizationId: string): Promise<POSConfig | null> {
  // Use type assertion since table may not exist yet in types
  const { data, error } = await supabase
    .from('organization_pos_config' as never)
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    // Table might not exist yet - return default config
    console.log('POS config not available, using defaults');
    return null;
  }

  if (!data) return null;

  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    organizationId: record.organization_id as string,
    posType: record.pos_type as POSType,
    syncEnabled: record.sync_enabled as boolean,
    lastSyncAt: (record.last_sync_at as string) || undefined,
    settings: (record.settings as Record<string, unknown>) || undefined,
  };
}

/**
 * Hook to get the POS configuration for the current organization
 */
export function usePOSConfig() {
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['pos-config', organizationId],
    queryFn: () => fetchPOSConfig(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get the POS adapter for the current organization
 * 
 * Returns the appropriate adapter based on the organization's
 * POS configuration. Defaults to Phorest if no config exists.
 */
export function usePOSAdapter(): POSAdapter | null {
  const { effectiveOrganization } = useOrganizationContext();
  const { data: posConfig } = usePOSConfig();
  
  const organizationId = effectiveOrganization?.id;

  return useMemo(() => {
    if (!organizationId) return null;

    // Determine POS type (default to phorest if not configured)
    const posType: POSType = posConfig?.posType || 'phorest';
    
    // Get the appropriate adapter factory
    const factory = adapterFactories[posType];
    
    // Create and return the adapter
    return factory(organizationId);
  }, [organizationId, posConfig?.posType]);
}

/**
 * Hook to get POS health status
 */
export function usePOSHealth() {
  const adapter = usePOSAdapter();

  return useQuery({
    queryKey: ['pos-health', adapter?.type],
    queryFn: async () => {
      if (!adapter) {
        return { healthy: false, message: 'No POS adapter available' };
      }
      return adapter.checkHealth();
    },
    enabled: !!adapter,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

/**
 * Hook to trigger a POS data sync
 */
export function usePOSSync() {
  const adapter = usePOSAdapter();

  const sync = async (syncType: 'full' | 'incremental' | 'appointments' | 'clients' | 'sales') => {
    if (!adapter) {
      throw new Error('No POS adapter available');
    }
    return adapter.syncData(syncType);
  };

  return { sync, isAvailable: !!adapter };
}
