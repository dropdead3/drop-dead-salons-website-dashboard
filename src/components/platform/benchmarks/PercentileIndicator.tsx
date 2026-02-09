import * as React from 'react';
import { cn } from '@/lib/utils';

interface PercentileIndicatorProps {
  percentile: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function PercentileIndicator({ 
  percentile, 
  size = 'md',
  showLabel = true,
  className 
}: PercentileIndicatorProps) {
  const barHeight = size === 'sm' ? 'h-2' : 'h-3';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const getColor = () => {
    if (percentile >= 75) return 'bg-emerald-500';
    if (percentile >= 50) return 'bg-violet-500';
    if (percentile >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className={cn(textSize, 'text-slate-400 whitespace-nowrap')}>
          Top {100 - percentile}%
        </span>
      )}
      <div className={cn('flex-1 rounded-full overflow-hidden bg-slate-700/50', barHeight)}>
        <div 
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${percentile}%` }}
        />
      </div>
    </div>
  );
}
