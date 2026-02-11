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
      <div className="max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 overflow-hidden transition-all duration-200 ease-in-out">
        <div className="flex items-center justify-end gap-0.5 px-3 py-1 border-b border-border/30">
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
      </div>
      {children}
    </div>
  );
}
