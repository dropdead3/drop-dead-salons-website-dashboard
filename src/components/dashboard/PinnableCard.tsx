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
  const contentRef = useRef<HTMLDivElement>(null);
  const [iconRect, setIconRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
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

  // Find and track the header icon box element (the bg-muted rounded-lg icon container)
  useEffect(() => {
    const wrapper = contentRef.current;
    if (!wrapper) return;
    // Find the icon box by looking for the standardized w-10 h-10 bg-muted container
    const iconEl = wrapper.querySelector('[class*="bg-muted"][class*="rounded-lg"][class*="w-10"]') as HTMLElement | null;
    if (iconEl) {
      iconEl.style.transition = 'opacity 200ms ease-in-out';
      iconEl.style.opacity = hovered ? '0' : '1';
      // Measure position relative to the PinnableCard wrapper
      const wrapperRect = wrapper.parentElement?.getBoundingClientRect();
      const elRect = iconEl.getBoundingClientRect();
      if (wrapperRect) {
        setIconRect({
          top: elRect.top - wrapperRect.top,
          left: elRect.left - wrapperRect.left,
          width: elRect.width,
          height: elRect.height,
        });
      }
    }
  }, [hovered]);
  
  return (
    <div 
      className={cn("relative h-full flex flex-col", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Z and Pin icons overlaid on the card header icon */}
      {iconRect && (
        <div 
          className="absolute z-10 flex items-center justify-center gap-0 transition-opacity duration-200 ease-in-out"
          style={{
            top: iconRect.top,
            left: iconRect.left - 4,
            height: iconRect.height,
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
          <div className="[&>button]:rounded-full [&>button]:h-7 [&>button]:w-7">
            <CommandCenterVisibilityToggle 
              elementKey={elementKey} 
              elementName={elementName}
              elementCategory={category}
            />
          </div>
        </div>
      )}
      <div ref={contentRef} className="flex-1 flex flex-col [&>*]:flex-1">
        {children}
      </div>
    </div>
  );
}
