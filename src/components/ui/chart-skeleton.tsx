import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const LINE_WIDTHS = ['w-full', 'w-5/6', 'w-4/6', 'w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-full'];

interface ChartSkeletonProps {
  /** Number of shimmer bars to render (default 6) */
  lines?: number;
  /** Additional classes on the outer wrapper (use to set height, e.g. h-[300px]) */
  className?: string;
}

/**
 * A generic multiline-text skeleton for chart / large-area loading states.
 * Renders staggered-width horizontal bars instead of a single blob.
 */
export function ChartSkeleton({ lines = 6, className }: ChartSkeletonProps) {
  return (
    <div className={cn('flex flex-col justify-evenly py-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', LINE_WIDTHS[i % LINE_WIDTHS.length])}
        />
      ))}
    </div>
  );
}
