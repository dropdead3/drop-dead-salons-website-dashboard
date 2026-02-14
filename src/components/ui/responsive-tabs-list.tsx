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
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);
  const [open, setOpen] = useState(false);

  const childArray = React.Children.toArray(children).filter(React.isValidElement);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    const list = listRef.current;
    if (!wrapper || !list) return;

    const availableWidth = wrapper.offsetWidth;
    const listPadding = 12; // p-1.5 = 6px * 2
    const overflowBtnWidth = 36;
    const gap = 2;
    const maxWidth = availableWidth - listPadding;

    // Temporarily show all to measure
    const items = Array.from(list.querySelectorAll('[data-tab-item]')) as HTMLElement[];
    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < items.length; i++) {
      items[i].style.display = '';
      const itemWidth = items[i].offsetWidth + (count > 0 ? gap : 0);
      const needsOverflowSpace = i < items.length - 1;

      if (usedWidth + itemWidth + (needsOverflowSpace ? overflowBtnWidth + gap : 0) > maxWidth && count > 0) {
        break;
      }
      usedWidth += itemWidth;
      count++;
    }

    // Hide items that don't fit
    for (let i = 0; i < items.length; i++) {
      if (count < items.length && i >= count) {
        items[i].style.display = 'none';
      }
    }

    setVisibleCount(count);
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(() => {
      // Reset display before re-measuring
      const list = listRef.current;
      if (list) {
        const items = Array.from(list.querySelectorAll('[data-tab-item]')) as HTMLElement[];
        items.forEach(item => item.style.display = '');
      }
      measure();
    });
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }
    return () => observer.disconnect();
  }, [measure, childArray.length]);

  const hasOverflow = visibleCount < childArray.length;
  const overflowChildren = hasOverflow ? childArray.slice(visibleCount) : [];

  return (
    <div ref={wrapperRef} className="w-full">
      <TabsList
        ref={(node) => {
          (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn('w-auto', className)}
        {...props}
      >
        {childArray.map((child, i) => (
          <span key={(child as React.ReactElement<any>).key || i} data-tab-item>
            {child}
          </span>
        ))}

        {hasOverflow && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center justify-center px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                // Try to get value from the child or its nested TabsTrigger
                const value = childEl.props.value || childEl.props.children?.props?.value;
                const content = childEl.props.children?.props?.children || childEl.props.children;

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
                    {content}
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
