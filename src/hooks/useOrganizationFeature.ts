import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

/**
 * Hook to check if a specific feature is enabled for the current organization.
 * 
 * Usage:
 * ```tsx
 * const { isEnabled, isLoading } = useOrganizationFeature('loyalty_program');
 * 
 * if (isLoading) return <Loading />;
 * if (!isEnabled) return null;
 * ```
 */
export function useOrganizationFeature(featureKey: string) {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  const query = useQuery({
    queryKey: ['org-feature', orgId, featureKey],
    queryFn: async (): Promise<boolean> => {
      if (!orgId) return true; // Default to enabled if no org context

      // Check organization_features table for override
      const { data: orgFeature, error: orgError } = await supabase
        .from('organization_features')
        .select('is_enabled')
        .eq('organization_id', orgId)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (orgError) throw orgError;

      // If org has an override, use that
      if (orgFeature !== null) {
        return orgFeature.is_enabled;
      }

      // Otherwise, check feature catalog for default
      const { data: catalog, error: catalogError } = await supabase
        .from('feature_catalog')
        .select('default_enabled, is_core')
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (catalogError) throw catalogError;

      // Core features are always enabled
      if (catalog?.is_core) return true;

      // Return catalog default or true if not found
      return catalog?.default_enabled ?? true;
    },
    enabled: !!featureKey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    isEnabled: query.data ?? true,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook to check multiple features at once.
 * 
 * Usage:
 * ```tsx
 * const { features, isLoading } = useOrganizationFeatures(['loyalty_program', 'feedback_hub']);
 * if (features.loyalty_program) { ... }
 * ```
 */
export function useMultipleOrganizationFeatures(featureKeys: string[]) {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['org-features-batch', orgId, featureKeys.sort().join(',')],
    queryFn: async (): Promise<Record<string, boolean>> => {
      if (!orgId) {
        return featureKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
      }

      // Get all org overrides
      const { data: orgFeatures, error: orgError } = await supabase
        .from('organization_features')
        .select('feature_key, is_enabled')
        .eq('organization_id', orgId)
        .in('feature_key', featureKeys);

      if (orgError) throw orgError;

      // Get catalog defaults for features without overrides
      const { data: catalog, error: catalogError } = await supabase
        .from('feature_catalog')
        .select('feature_key, default_enabled, is_core')
        .in('feature_key', featureKeys);

      if (catalogError) throw catalogError;

      // Build result map
      const overrideMap = new Map(
        (orgFeatures || []).map(f => [f.feature_key, f.is_enabled])
      );
      const catalogMap = new Map(
        (catalog || []).map(f => [f.feature_key, { default: f.default_enabled, isCore: f.is_core }])
      );

      return featureKeys.reduce((acc, key) => {
        // Check for override first
        if (overrideMap.has(key)) {
          return { ...acc, [key]: overrideMap.get(key)! };
        }
        // Check catalog
        const catalogEntry = catalogMap.get(key);
        if (catalogEntry?.isCore) {
          return { ...acc, [key]: true };
        }
        return { ...acc, [key]: catalogEntry?.default ?? true };
      }, {} as Record<string, boolean>);
    },
    enabled: featureKeys.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
