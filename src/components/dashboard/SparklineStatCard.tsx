import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { TrendSparkline } from './TrendSparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineStatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  sparklineData?: number[];
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  size?: 'compact' | 'standard';
  invertTrend?: boolean;
  className?: string;
}

export function SparklineStatCard({
  title,
  value,
  icon,
  sparklineData,
  trend,
  trendLabel,
  variant = 'default',
  size = 'standard',
  invertTrend = false,
  className,
}: SparklineStatCardProps) {
  const isPositiveTrend = trend !== undefined && (invertTrend ? trend < 0 : trend > 0);
  const isNegativeTrend = trend !== undefined && (invertTrend ? trend > 0 : trend < 0);

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="w-3 h-3" />;
    }
    return trend > 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    if (isPositiveTrend) return 'text-green-600';
    if (isNegativeTrend) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/5 border-green-500/20';
      case 'warning':
        return 'bg-amber-500/5 border-amber-500/20';
      case 'danger':
        return 'bg-red-500/5 border-red-500/20';
      case 'primary':
        return 'bg-primary/5 border-primary/20';
      default:
        return 'bg-muted/30';
    }
  };

  if (size === 'compact') {
    return (
      <div className={cn('text-center p-2.5 rounded-lg', getVariantStyles(), className)}>
        {icon && (
          <div className="flex items-center justify-center mb-1">
            {icon}
          </div>
        )}
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{title}</p>
        {sparklineData && sparklineData.length >= 2 && (
          <div className="flex justify-center mt-1.5">
            <TrendSparkline 
              data={sparklineData} 
              size="xs" 
              variant={variant === 'default' ? 'default' : variant}
              invertTrend={invertTrend}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                {icon}
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate">{title}</p>
          </div>
          <p className="text-xl font-semibold">{value}</p>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && (
                <span className="text-muted-foreground ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <div className="flex-shrink-0">
            <TrendSparkline 
              data={sparklineData} 
              size="sm" 
              variant={variant === 'default' ? 'default' : variant}
              invertTrend={invertTrend}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
