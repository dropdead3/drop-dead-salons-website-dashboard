import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RESPONSIVE_TABS_CLASSES, RESPONSIVE_TABS_LAYOUT } from "./tabs.tokens";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const OVERFLOW_BUTTON_WIDTH = RESPONSIVE_TABS_LAYOUT.overflowButtonWidth;
const LIST_TO_OVERFLOW_GAP_PX = RESPONSIVE_TABS_LAYOUT.listToOverflowGapPx;
const RIGHT_SAFE_INSET_PX = RESPONSIVE_TABS_LAYOUT.rightSafeInsetPx;
const EPSILON_PX = RESPONSIVE_TABS_LAYOUT.epsilonPx;

export interface ResponsiveTabsItem {
  value: string;
  label: React.ReactNode;
}

export interface ResponsiveTabsListProps {
  items: ResponsiveTabsItem[];
  onTabChange?: (value: string) => void;
  className?: string;
}

export function ResponsiveTabsList({
  items,
  onTabChange,
  className,
}: ResponsiveTabsListProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const [visibleCount, setVisibleCount] = React.useState(items.length);
  const [overflowOpen, setOverflowOpen] = React.useState(false);

  const measure = React.useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || items.length === 0) return;

    const applyVisibility = (count: number) => {
      for (let i = 0; i < items.length; i++) {
        const el = itemRefs.current.get(items[i].value);
        if (!el) continue;
        el.style.display = i < count ? "" : "none";
      }
    };

    // Temporarily show all items so we can measure them (hidden items have offsetWidth 0)
    applyVisibility(items.length);

    // Use rendered positions instead of width math, so tabs disappear BEFORE they touch the right edge.
    // Also clamp to the viewport right edge: in some layouts the container can extend past the viewport.
    const containerEl = listRef.current ?? wrapper.parentElement ?? wrapper;
    const containerRect = containerEl.getBoundingClientRect();
    const viewportRight = wrapper.ownerDocument?.documentElement?.clientWidth ?? window.innerWidth;
    const clampedContainerRight = Math.min(containerRect.right, viewportRight);
    const eps = EPSILON_PX; // tolerance to avoid flicker at pixel boundaries

    const triggers = items.map((item) => itemRefs.current.get(item.value));
    if (triggers.some((t) => !t)) return;

    const calcVisible = (rightLimit: number) => {
      for (let i = 0; i < triggers.length; i++) {
        const rect = (triggers[i] as HTMLButtonElement).getBoundingClientRect();
        if (rect.right > rightLimit + eps) return i;
      }
      return triggers.length;
    };

    // Pass 1: no overflow button reserved.
    const countNoOverflow = calcVisible(clampedContainerRight - RIGHT_SAFE_INSET_PX);
    if (countNoOverflow === triggers.length) {
      applyVisibility(triggers.length);
      setVisibleCount(triggers.length);
      return;
    }

    // Pass 2: reserve space for overflow button.
    const reservedRight =
      clampedContainerRight -
      OVERFLOW_BUTTON_WIDTH -
      LIST_TO_OVERFLOW_GAP_PX -
      RIGHT_SAFE_INSET_PX;
    const countWithOverflow = calcVisible(reservedRight);
    applyVisibility(countWithOverflow);
    setVisibleCount(countWithOverflow);
  }, [items]);

  React.useLayoutEffect(() => {
    // Double rAF ensures layout is complete (refs set, parent dimensions settled)
    let raf1: number | undefined;
    const raf2 = requestAnimationFrame(() => {
      raf1 = requestAnimationFrame(() => measure());
    });
    return () => {
      cancelAnimationFrame(raf2);
      if (typeof raf1 === "number") cancelAnimationFrame(raf1);
    };
  }, [measure, items]);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    // Also observe parent - it's the overflow-hidden container that constrains our width
    const parent = wrapper.parentElement;
    if (parent) ro.observe(parent);
    // Observe the list itself — its width changes when fonts load / labels change,
    // even if the wrapper width stays constant.
    if (listRef.current) ro.observe(listRef.current);
    // Fallback: viewport resize can change the effective right edge without changing element widths.
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [measure]);

  const overflowItems = visibleCount < items.length ? items.slice(visibleCount) : [];
  const showOverflow = overflowItems.length > 0;

  const handleOverflowSelect = (value: string) => {
    onTabChange?.(value);
    setOverflowOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        RESPONSIVE_TABS_CLASSES.wrapper,
        className
      )}
    >
      <TabsList
        ref={listRef}
        className={RESPONSIVE_TABS_CLASSES.list}
      >
        {items.map((item, idx) => (
          <TabsTrigger
            key={item.value}
            ref={(el) => {
              if (el) itemRefs.current.set(item.value, el);
            }}
            value={item.value}
            className="gap-2"
            data-tab-item
          >
            <span className="inline-flex items-center gap-2">
              {item.label}
            </span>
          </TabsTrigger>
        ))}

        {/* Overflow trigger lives INSIDE the same TabsList pill */}
        {showOverflow && (
          <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
          <PopoverTrigger asChild>
              <button
                type="button"
                className={RESPONSIVE_TABS_CLASSES.overflowTrigger}
                aria-label="More tabs"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-1 min-w-[140px]">
              <div className="flex flex-col gap-0.5">
                {overflowItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={RESPONSIVE_TABS_CLASSES.overflowMenuItem}
                    onClick={() => handleOverflowSelect(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </TabsList>
    </div>
  );
}
