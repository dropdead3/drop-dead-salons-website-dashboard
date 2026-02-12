import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from './CommandCenterVisibilityToggle';
import { ZuraCardInsight } from './ZuraCardInsight';
import { useRegisterVisibilityElement } from '@/hooks/useDashboardVisibility';
import { useEffect, useRef, useState } from 'react';

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
  const [hovered, setHovered] = useState(false);
  
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
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icons absolutely positioned in the card header area */}
      <div 
        className="absolute top-5 left-3 z-10 flex flex-col items-center gap-1 transition-all duration-200 ease-in-out pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-12px)',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
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
      <PinnableCardContent hovered={hovered}>
        {children}
      </PinnableCardContent>
    </div>
  );
}

/** Injects padding-left into the card's header row (first child of the Card) on hover */
function PinnableCardContent({ hovered, children }: { hovered: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return;
    // Target: wrapper > Card > first child (header row)
    const card = wrapper.firstElementChild;
    const headerRow = card?.firstElementChild as HTMLElement | null;
    if (headerRow) {
      headerRow.style.transition = 'padding-left 200ms ease-in-out';
      headerRow.style.paddingLeft = hovered ? '2.5rem' : '';
    }
  }, [hovered]);

  return <div ref={ref}>{children}</div>;
}
