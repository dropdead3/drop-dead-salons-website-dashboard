/**
 * POS Provider Label Hook
 * 
 * Returns dynamic provider labels based on the organization's
 * POS configuration. Used to eliminate hardcoded "Phorest" references
 * from user-facing UI strings.
 */

import { useMemo } from 'react';
import { usePOSConfig } from '@/hooks/usePOSData';

function titleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface POSProviderLabel {
  /** Title-cased provider name, e.g. "Phorest", "Boulevard", or null if none */
  providerName: string | null;
  /** Provider name with "POS" fallback -- never blank */
  providerLabel: string;
  /** e.g. "Phorest Sync" or "POS Sync" */
  syncLabel: string;
  /** Whether a POS integration is configured */
  isConnected: boolean;
}

export function usePOSProviderLabel(): POSProviderLabel {
  const { data: posConfig } = usePOSConfig();

  return useMemo(() => {
    const posType = posConfig?.posType;
    const providerName = posType ? titleCase(posType) : null;
    const providerLabel = providerName || 'POS';
    const syncLabel = `${providerLabel} Sync`;
    const isConnected = !!posType && (posConfig?.syncEnabled ?? false);

    return { providerName, providerLabel, syncLabel, isConnected };
  }, [posConfig?.posType, posConfig?.syncEnabled]);
}
