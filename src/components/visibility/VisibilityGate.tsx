import { ReactNode } from 'react';
import { useMyDashboardVisibility } from '@/hooks/useDashboardVisibility';

interface VisibilityGateProps {
  /** Unique key identifying this element in the visibility system */
  elementKey: string;
  /** Content to render when visible */
  children: ReactNode;
  /** Optional fallback content when hidden (defaults to null) */
  fallback?: ReactNode;
  /** If true, shows content while visibility data is loading (default: true) */
  showWhileLoading?: boolean;
}

/**
 * Wrapper component that conditionally renders children based on role-based visibility settings.
 * Uses the dashboard_element_visibility table to determine if the current user's role(s)
 * should see this element.
 * 
 * @example
 * ```tsx
 * <VisibilityGate elementKey="sales_overview">
 *   <SalesOverviewCard />
 * </VisibilityGate>
 * ```
 */
export function VisibilityGate({ 
  elementKey, 
  children, 
  fallback = null,
  showWhileLoading = true,
}: VisibilityGateProps) {
  const { data: visibility = {}, isLoading } = useMyDashboardVisibility();
  
  // Show content while loading to prevent flash of missing content
  if (isLoading && showWhileLoading) {
    return <>{children}</>;
  }
  
  // Default to visible if the element isn't in the visibility map
  // This ensures new elements are visible until explicitly hidden
  const isVisible = visibility[elementKey] !== false;
  
  if (!isVisible) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook version for cases where you need conditional logic instead of wrapping
 */
export function useElementVisibility(elementKey: string): boolean {
  const { data: visibility = {} } = useMyDashboardVisibility();
  return visibility[elementKey] !== false;
}
