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
    <div className={cn("relative group flex flex-row", className)}>
      <div className="flex flex-col items-center justify-start pt-3 gap-1 max-w-0 opacity-0 group-hover:max-w-[40px] group-hover:opacity-100 overflow-hidden transition-all duration-200 ease-in-out shrink-0 border-r border-border/0 group-hover:border-border/30">
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
      <div className="flex-1 min-w-0 transition-all duration-200">
        {children}
      </div>
    </div>
  );
}
