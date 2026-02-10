import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from './CommandCenterVisibilityToggle';
import { ZuraCardInsight } from './ZuraCardInsight';
import { useRegisterVisibilityElement } from '@/hooks/useDashboardVisibility';
import { useEffect, useRef } from 'react';

interface PinnableCardProps {
  elementKey: string;
  elementName: string;
  category?: string;
  children: ReactNode;
  className?: string;
  /** Optional metric data to enable Zura AI analysis */
  metricData?: Record<string, string | number>;
  /** Date range context for AI analysis */
  dateRange?: string;
  /** Location name context for AI analysis */
  locationName?: string;
}

export function PinnableCard({ 
  elementKey, 
  elementName, 
  category = 'Analytics Hub',
  children, 
  className,
  metricData,
  dateRange,
  locationName,
}: PinnableCardProps) {
  const registerMutation = useRegisterVisibilityElement();
  const hasRegistered = useRef(false);
  
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
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
        <ZuraCardInsight 
          cardName={elementName}
          metricData={metricData}
          dateRange={dateRange}
          locationName={locationName}
        />
        <CommandCenterVisibilityToggle 
          elementKey={elementKey} 
          elementName={elementName} 
        />
      </div>
      {children}
    </div>
  );
}
