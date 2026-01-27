import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from './CommandCenterVisibilityToggle';
import { useRegisterVisibilityElement } from '@/hooks/useDashboardVisibility';
import { useEffect, useRef } from 'react';

interface PinnableCardProps {
  /** Unique key identifying this element in the visibility system */
  elementKey: string;
  /** Display name for the element */
  elementName: string;
  /** Category for organizing in visibility console */
  category?: string;
  /** Content to render */
  children: ReactNode;
  /** Additional classes */
  className?: string;
}

/**
 * Wrapper component that adds a pinning gear icon to any analytics section.
 * The gear icon appears on hover and allows Super Admins to pin/unpin the section
 * to the Command Center for all leadership roles.
 * 
 * Automatically registers the element in the visibility system on first render.
 * 
 * @example
 * ```tsx
 * <PinnableCard elementKey="sales_kpi_grid" elementName="Sales KPIs">
 *   <SalesKPIGrid />
 * </PinnableCard>
 * ```
 */
export function PinnableCard({ 
  elementKey, 
  elementName, 
  category = 'Analytics Hub',
  children, 
  className 
}: PinnableCardProps) {
  const registerMutation = useRegisterVisibilityElement();
  const hasRegistered = useRef(false);
  
  // Auto-register element on first render
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true;
      registerMutation.mutate({
        elementKey,
        elementName,
        elementCategory: category,
      });
    }
  }, [elementKey, elementName, category, registerMutation]);
  
  return (
    <div className={cn("relative group", className)}>
      {/* Pin toggle - appears on hover for super admins */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CommandCenterVisibilityToggle 
          elementKey={elementKey} 
          elementName={elementName} 
        />
      </div>
      {children}
    </div>
  );
}
