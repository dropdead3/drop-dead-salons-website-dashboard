import { useMemo } from 'react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { getOrgDefaults, ORG_DEFAULTS_FALLBACKS, type OrgDefaults } from '@/types/orgDefaults';

export interface UseOrgDefaultsResult extends Required<OrgDefaults> {
  /** Raw defaults from org (no fallbacks). */
  raw: OrgDefaults;
}

/**
 * Returns the effective org's locale, currency, and timezone with safe fallbacks.
 * Use for formatting (formatCurrency, formatDate) and i18n.
 */
export function useOrgDefaults(): UseOrgDefaultsResult {
  const { effectiveOrganization } = useOrganizationContext();
  return useMemo(() => {
    const raw = effectiveOrganization
      ? getOrgDefaults(effectiveOrganization.settings ?? null)
      : {};
    return {
      currency: raw.currency ?? ORG_DEFAULTS_FALLBACKS.currency,
      timezone: raw.timezone ?? ORG_DEFAULTS_FALLBACKS.timezone,
      locale: raw.locale ?? ORG_DEFAULTS_FALLBACKS.locale,
      raw,
    };
  }, [effectiveOrganization]);
}
