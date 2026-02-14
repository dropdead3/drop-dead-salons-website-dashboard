import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabsList } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ResponsiveTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  onTabChange?: (value: string) => void;
}

/**
 * A responsive TabsList that measures available space and collapses
 * overflow tabs (right-to-left) into a "⋯" popover menu.
 */
export const ResponsiveTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  ResponsiveTabsListProps
>(({ className, children, onTabChange, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(React.Children.count(children));
  const [open, setOpen] = useState(false);

  const childArray = React.Children.toArray(children).filter(React.isValidElement);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const measureRow = measureRef.current;
    if (!container || !measureRow) return;

    const containerWidth = container.clientWidth;
    // Reserve space for the overflow button (40px + gap)
    const overflowBtnWidth = 44;
    const gap = 2; // gap-0.5 = 2px
    let usedWidth = 0;
    let count = 0;

    const items = measureRow.children;
    for (let i = 0; i < items.length; i++) {
      const itemWidth = (items[i] as HTMLElement).offsetWidth + (i > 0 ? gap : 0);
      // Check if adding this item (and potentially the overflow btn) would exceed
      if (usedWidth + itemWidth + (i < items.length - 1 ? overflowBtnWidth + gap : 0) > containerWidth) {
        break;
      }
      usedWidth += itemWidth;
      count++;
    }

    // If all items fit without overflow button, show them all
    if (count === items.length) {
      setVisibleCount(items.length);
    } else {
      setVisibleCount(Math.max(1, count));
    }
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(() => measure());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [measure, childArray.length]);

  const visibleChildren = childArray.slice(0, visibleCount);
  const overflowChildren = childArray.slice(visibleCount);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      {/* Hidden measurement row — renders all children to get natural widths */}
      <div
        ref={measureRef}
        className="flex items-center gap-0.5 absolute invisible pointer-events-none h-0 overflow-hidden"
        aria-hidden
      >
        {childArray}
      </div>

      {/* Visible row */}
      <TabsList
        ref={ref}
        className={cn('w-auto inline-flex', className)}
        {...props}
      >
        {visibleChildren}

        {overflowChildren.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground',
                )}
                style={{ borderRadius: 7 }}
                aria-label="More tabs"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-auto min-w-[160px] p-1.5 flex flex-col gap-0.5"
            >
              {overflowChildren.map((child) => {
                if (!React.isValidElement(child)) return null;
                // Clone the trigger but render as a full-width menu item
                return React.cloneElement(child as React.ReactElement<any>, {
                  key: (child as React.ReactElement<any>).props.value || (child as React.ReactElement<any>).key,
                  className: cn(
                    (child as React.ReactElement<any>).props.className,
                    'w-full justify-start'
                  ),
                  onClick: () => {
                    const value = (child as React.ReactElement<any>).props.value;
                    if (value && onTabChange) {
                      onTabChange(value);
                    }
                    setOpen(false);
                  },
                });
              })}
            </PopoverContent>
          </Popover>
        )}
      </TabsList>
    </div>
  );
});

ResponsiveTabsList.displayName = 'ResponsiveTabsList';
