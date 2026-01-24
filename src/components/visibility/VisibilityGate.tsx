import { ReactNode, useEffect, useRef } from 'react';
import { useMyDashboardVisibility, useRegisterVisibilityElement } from '@/hooks/useDashboardVisibility';

interface VisibilityGateProps {
  /** Unique key identifying this element in the visibility system */
  elementKey: string;
  /** Content to render when visible */
  children: ReactNode;
  /** Optional fallback content when hidden (defaults to null) */
  fallback?: ReactNode;
  /** If true, shows content while visibility data is loading (default: true) */
  showWhileLoading?: boolean;
  /** If provided with elementName and elementCategory, auto-registers the element */
  elementName?: string;
  /** Category for grouping in the Visibility Console */
  elementCategory?: string;
}

/**
 * Wrapper component that conditionally renders children based on role-based visibility settings.
 * Uses the dashboard_element_visibility table to determine if the current user's role(s)
 * should see this element.
 * 
 * If elementName and elementCategory are provided, the element will be auto-registered
 * in the visibility system on first render.
 * 
 * @example
 * ```tsx
 * // Basic usage (element must already exist in database)
 * <VisibilityGate elementKey="sales_overview">
 *   <SalesOverviewCard />
 * </VisibilityGate>
 * 
 * // With auto-registration (will create element if it doesn't exist)
 * <VisibilityGate 
 *   elementKey="new_feature" 
 *   elementName="New Feature" 
 *   elementCategory="Dashboard Home"
 * >
 *   <NewFeature />
 * </VisibilityGate>
 * ```
 */
export function VisibilityGate({ 
  elementKey, 
  children, 
  fallback = null,
  showWhileLoading = true,
  elementName,
  elementCategory,
}: VisibilityGateProps) {
  const { data: visibility = {}, isLoading } = useMyDashboardVisibility();
  const registerMutation = useRegisterVisibilityElement();
  const hasRegistered = useRef(false);
  
  // Auto-register element if name and category are provided
  useEffect(() => {
    if (elementName && elementCategory && !hasRegistered.current) {
      hasRegistered.current = true;
      registerMutation.mutate({
        elementKey,
        elementName,
        elementCategory,
      });
    }
  }, [elementKey, elementName, elementCategory, registerMutation]);
  
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
