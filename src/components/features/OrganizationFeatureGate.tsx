import { ReactNode } from 'react';
import { useOrganizationFeature } from '@/hooks/useOrganizationFeature';

interface OrganizationFeatureGateProps {
  /** The feature key to check */
  featureKey: string;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Optional content to render when feature is disabled */
  fallback?: ReactNode;
  /** Whether to show children while loading (defaults to false) */
  showWhileLoading?: boolean;
  /** Loading indicator component */
  loadingComponent?: ReactNode;
}

/**
 * OrganizationFeatureGate component for conditional rendering based on organization features.
 * 
 * Usage:
 * ```tsx
 * <OrganizationFeatureGate featureKey="loyalty_program">
 *   <RewardsPage />
 * </OrganizationFeatureGate>
 * 
 * // With fallback
 * <OrganizationFeatureGate featureKey="feedback_hub" fallback={<UpgradeCTA />}>
 *   <FeedbackHub />
 * </OrganizationFeatureGate>
 * ```
 */
export function OrganizationFeatureGate({
  featureKey,
  children,
  fallback = null,
  showWhileLoading = false,
  loadingComponent = null,
}: OrganizationFeatureGateProps) {
  const { isEnabled, isLoading } = useOrganizationFeature(featureKey);

  if (isLoading) {
    if (loadingComponent) return <>{loadingComponent}</>;
    if (showWhileLoading) return <>{children}</>;
    return <>{fallback}</>;
  }

  return <>{isEnabled ? children : fallback}</>;
}

export default OrganizationFeatureGate;
