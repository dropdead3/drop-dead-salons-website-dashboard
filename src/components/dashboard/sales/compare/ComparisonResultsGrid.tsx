import { ArrowUpRight, ArrowDownRight, Minus, DollarSign, Percent, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComparisonResult } from '@/hooks/useComparisonData';

interface ComparisonResultsGridProps {
  data: ComparisonResult | undefined;
  isLoading: boolean;
}

export function ComparisonResultsGrid({ data, isLoading }: ComparisonResultsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-lg p-4 border animate-pulse">
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-8 bg-muted rounded w-24 mb-1" />
            <div className="h-4 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select periods to compare
      </div>
    );
  }

  const metrics = [
    {
      label: 'Period A Revenue',
      value: data.periodA.totalRevenue,
      format: (v: number) => `$${v.toLocaleString()}`,
      icon: DollarSign,
      variant: 'primary' as const,
    },
    {
      label: 'Period B Revenue',
      value: data.periodB.totalRevenue,
      format: (v: number) => `$${v.toLocaleString()}`,
      icon: DollarSign,
      variant: 'secondary' as const,
    },
    {
      label: 'Change',
      value: data.changes.totalRevenue,
      format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
      icon: Percent,
      variant: 'change' as const,
      isChange: true,
    },
    {
      label: 'Difference',
      value: data.difference.revenue,
      format: (v: number) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toLocaleString()}`,
      icon: Hash,
      variant: 'difference' as const,
      isChange: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const isPositive = metric.isChange ? metric.value > 0 : true;
        const isNeutral = metric.isChange && metric.value === 0;
        const Icon = metric.icon;

        return (
          <div
            key={metric.label}
            className={cn(
              'bg-card rounded-lg p-4 border',
              metric.variant === 'primary' && 'border-primary/20 bg-primary/5',
              metric.variant === 'change' && !isNeutral && (isPositive ? 'border-chart-2/20 bg-chart-2/5' : 'border-destructive/20 bg-destructive/5')
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-2xl font-display',
                metric.isChange && !isNeutral && (isPositive ? 'text-chart-2' : 'text-destructive')
              )}>
                {metric.format(metric.value)}
              </span>
              {metric.isChange && !isNeutral && (
                isPositive ? (
                  <ArrowUpRight className="w-5 h-5 text-chart-2" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                )
              )}
              {metric.isChange && isNeutral && (
                <Minus className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
