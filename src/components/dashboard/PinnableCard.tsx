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
      {/* Z and Pin icons overlaid on the card header icon position */}
      <div 
        className="absolute top-6 left-6 z-10 flex items-center gap-1 transition-all duration-200 ease-in-out"
        style={{
          opacity: hovered ? 1 : 0,
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

/** Fades out the card's header icon on hover so the Z/Pin icons replace it */
function PinnableCardContent({ hovered, children }: { hovered: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return;
    // Target: wrapper > Card > header row > first element (the icon container)
    const card = wrapper.firstElementChild;
    const headerRow = card?.firstElementChild as HTMLElement | null;
    const headerIcon = headerRow?.firstElementChild as HTMLElement | null;
    if (headerIcon) {
      headerIcon.style.transition = 'opacity 200ms ease-in-out';
      headerIcon.style.opacity = hovered ? '0' : '1';
    }
  }, [hovered]);

  return <div ref={ref}>{children}</div>;
}
