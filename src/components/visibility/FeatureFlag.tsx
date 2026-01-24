import { ReactNode } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

interface FeatureFlagProps {
  /** The unique key of the feature flag to check */
  flagKey: string;
  /** Content to render when flag is enabled */
  children: ReactNode;
  /** Optional content to render when flag is disabled */
  fallback?: ReactNode;
  /** Whether to show children while loading (defaults to false) */
  showWhileLoading?: boolean;
  /** Loading indicator component */
  loadingComponent?: ReactNode;
}

/**
 * FeatureFlag component for conditional rendering based on feature flags.
 * 
 * Usage:
 * ```tsx
 * <FeatureFlag flagKey="new_dashboard_layout">
 *   <NewDashboard />
 * </FeatureFlag>
 * 
 * // With fallback
 * <FeatureFlag flagKey="beta_features" fallback={<LegacyComponent />}>
 *   <BetaComponent />
 * </FeatureFlag>
 * ```
 */
export function FeatureFlag({
  flagKey,
  children,
  fallback = null,
  showWhileLoading = false,
  loadingComponent = null,
}: FeatureFlagProps) {
  const { data: isEnabled, isLoading } = useFeatureFlag(flagKey);

  if (isLoading) {
    if (loadingComponent) return <>{loadingComponent}</>;
    if (showWhileLoading) return <>{children}</>;
    return <>{fallback}</>;
  }

  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Hook to check if a feature flag is enabled.
 * Use this when you need programmatic access to the flag status.
 * 
 * Usage:
 * ```tsx
 * const { isEnabled, isLoading } = useFeatureFlagCheck('new_feature');
 * 
 * if (isLoading) return <Loading />;
 * if (isEnabled) {
 *   // Do something
 * }
 * ```
 */
export function useFeatureFlagCheck(flagKey: string) {
  const { data: isEnabled, isLoading, error } = useFeatureFlag(flagKey);
  
  return {
    isEnabled: isEnabled ?? false,
    isLoading,
    error,
  };
}

export default FeatureFlag;
