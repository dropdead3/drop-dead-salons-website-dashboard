import React from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  maxPerRow?: number;
  gap?: string;
  className?: string;
}

export function BentoGrid({ children, maxPerRow = 3, gap = 'gap-3', className }: BentoGridProps) {
  const items = React.Children.toArray(children);
  const count = items.length;

  if (count <= maxPerRow) {
    return (
      <div className={cn('flex', gap, className)}>
        {items.map((child, i) => (
          <div key={i} className="flex-1 min-w-0">{child}</div>
        ))}
      </div>
    );
  }

  const topCount = Math.ceil(count / 2);
  const topRow = items.slice(0, topCount);
  const bottomRow = items.slice(topCount);

  return (
    <div className={cn('flex flex-col', gap, className)}>
      <div className={cn('flex', gap)}>
        {topRow.map((child, i) => (
          <div key={i} className="flex-1 min-w-0">{child}</div>
        ))}
      </div>
      <div className={cn('flex', gap)}>
        {bottomRow.map((child, i) => (
          <div key={i} className="flex-1 min-w-0">{child}</div>
        ))}
      </div>
    </div>
  );
}
