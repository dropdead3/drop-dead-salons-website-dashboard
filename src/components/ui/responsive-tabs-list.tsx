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
 * A responsive TabsList that hides overflow tabs into a "⋯" popover.
 * Children must be TabsTrigger elements (or wrappers around them).
 */
export const ResponsiveTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  ResponsiveTabsListProps
>(({ className, children, onTabChange, ...props }, ref) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const childArray = React.Children.toArray(children).filter(React.isValidElement);

  const measure = useCallback(() => {
    const list = innerRef.current;
    if (!list) return;

    const listWidth = list.clientWidth;
    const items = Array.from(list.children) as HTMLElement[];
    const overflowBtnWidth = 44;
    const gap = 2;
    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < items.length; i++) {
      // Skip the overflow button itself
      if (items[i].dataset.overflow === 'true') continue;
      
      const itemWidth = items[i].scrollWidth + (count > 0 ? gap : 0);
      const needsOverflow = i < childArray.length - 1;
      
      if (usedWidth + itemWidth + (needsOverflow ? overflowBtnWidth + gap : 0) > listWidth && count > 0) {
        break;
      }
      usedWidth += itemWidth;
      count++;
    }

    if (count >= childArray.length) {
      setVisibleCount(null); // show all
    } else {
      setVisibleCount(Math.max(1, count));
    }
  }, [childArray.length]);

  useEffect(() => {
    // Delay initial measure to let items render
    const timer = setTimeout(measure, 50);
    const observer = new ResizeObserver(() => measure());
    if (innerRef.current) {
      observer.observe(innerRef.current);
    }
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [measure]);

  const showAll = visibleCount === null;
  const overflowChildren = showAll ? [] : childArray.slice(visibleCount);

  return (
    <TabsList
      ref={(node) => {
        // Merge refs
        (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn('w-auto inline-flex', className)}
      {...props}
    >
      {childArray.map((child, i) => {
        if (!showAll && i >= visibleCount!) {
          // Hide overflow items via CSS (keep in DOM for Radix context but visually hidden)
          return React.cloneElement(child as React.ReactElement<any>, {
            key: (child as React.ReactElement<any>).key || i,
            className: cn((child as React.ReactElement<any>).props.className, 'hidden'),
          });
        }
        return child;
      })}

      {overflowChildren.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              data-overflow="true"
              className="inline-flex items-center justify-center whitespace-nowrap px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
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
              const childEl = child as React.ReactElement<any>;
              // Extract info to render a plain button
              const value = childEl.props.value;
              const childContent = childEl.props.children;
              
              return (
                <button
                  key={value || childEl.key}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
                  style={{ borderRadius: 7 }}
                  onClick={() => {
                    if (value && onTabChange) {
                      onTabChange(value);
                    }
                    setOpen(false);
                  }}
                >
                  {childContent}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      )}
    </TabsList>
  );
});

ResponsiveTabsList.displayName = 'ResponsiveTabsList';
