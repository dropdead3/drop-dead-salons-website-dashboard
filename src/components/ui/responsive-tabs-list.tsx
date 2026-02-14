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

export const ResponsiveTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  ResponsiveTabsListProps
>(({ className, children, onTabChange, ...props }, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [measured, setMeasured] = useState(false);

  const childArray = React.Children.toArray(children).filter(React.isValidElement);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    const measureRow = measureRef.current;
    if (!wrapper || !measureRow) return;

    const availableWidth = wrapper.clientWidth;
    // Padding of TabsList (p-1.5 = 6px each side = 12px total)
    const listPadding = 12;
    const overflowBtnWidth = 40;
    const gap = 2;
    const maxContentWidth = availableWidth - listPadding;

    const items = Array.from(measureRow.children) as HTMLElement[];
    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < items.length; i++) {
      const itemWidth = items[i].offsetWidth + (count > 0 ? gap : 0);

      // If this isn't the last item, reserve space for overflow button
      const remaining = i < items.length - 1 ? overflowBtnWidth + gap : 0;

      if (usedWidth + itemWidth + remaining > maxContentWidth && count > 0) {
        break;
      }
      usedWidth += itemWidth;
      count++;
    }

    if (count >= items.length) {
      setVisibleCount(null);
    } else {
      setVisibleCount(Math.max(1, count));
    }
    setMeasured(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(measure, 30);
    const observer = new ResizeObserver(() => measure());
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [measure, childArray.length]);

  const showAll = visibleCount === null;
  const overflowChildren = showAll ? [] : childArray.slice(visibleCount);

  return (
    <div ref={wrapperRef} className="w-full max-w-full overflow-hidden">
      {/* Hidden measure row — full natural widths, outside TabsList to avoid Radix issues */}
      <div
        ref={measureRef}
        className="flex items-center gap-0.5 h-0 overflow-hidden invisible pointer-events-none absolute"
        aria-hidden
      >
        {childArray.map((child, i) => (
          <div key={i} className="inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-1.5 text-sm font-medium">
            {(child as React.ReactElement<any>).props.children}
          </div>
        ))}
      </div>

      <TabsList
        ref={ref}
        className={cn('w-full', measured ? '' : 'invisible', className)}
        {...props}
      >
        {childArray.map((child, i) => {
          if (!showAll && i >= visibleCount!) {
            return React.cloneElement(child as React.ReactElement<any>, {
              key: (child as React.ReactElement<any>).key || i,
              style: { display: 'none' },
            });
          }
          return child;
        })}

        {overflowChildren.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                data-overflow="true"
                className="inline-flex items-center justify-center whitespace-nowrap px-2 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground ml-auto"
                style={{ borderRadius: 6 }}
                aria-label="More tabs"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-auto min-w-[180px] p-1.5 flex flex-col gap-0.5"
            >
              {overflowChildren.map((child) => {
                const childEl = child as React.ReactElement<any>;
                const value = childEl.props.value;
                const childContent = childEl.props.children;

                return (
                  <button
                    key={value || childEl.key}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
                    style={{ borderRadius: 6 }}
                    onClick={() => {
                      if (value && onTabChange) onTabChange(value);
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
    </div>
  );
});

ResponsiveTabsList.displayName = 'ResponsiveTabsList';
