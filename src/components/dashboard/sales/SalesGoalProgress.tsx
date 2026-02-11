import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { getDaysInMonth, getDaysInYear, getDayOfYear, startOfWeek, differenceInDays } from 'date-fns';

interface SalesGoalProgressProps {
  current: number;
  target: number;
  label?: string;
  className?: string;
  goalPeriod?: 'weekly' | 'monthly' | 'yearly';
}

function getElapsedFraction(period: 'weekly' | 'monthly' | 'yearly'): number {
  const now = new Date();
  switch (period) {
    case 'weekly': {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const elapsed = differenceInDays(now, weekStart) + 1;
      return elapsed / 7;
    }
    case 'monthly': {
      const day = now.getDate();
      const daysInMonth = getDaysInMonth(now);
      return day / daysInMonth;
    }
    case 'yearly': {
      const dayOfYear = getDayOfYear(now);
      const daysInYear = getDaysInYear(now);
      return dayOfYear / daysInYear;
    }
  }
}

function getRemainingDays(period: 'weekly' | 'monthly' | 'yearly'): number {
  const now = new Date();
  switch (period) {
    case 'weekly': {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const elapsed = differenceInDays(now, weekStart) + 1;
      return Math.max(7 - elapsed, 1);
    }
    case 'monthly': {
      const daysInMonth = getDaysInMonth(now);
      return Math.max(daysInMonth - now.getDate(), 1);
    }
    case 'yearly': {
      const daysInYear = getDaysInYear(now);
      return Math.max(daysInYear - getDayOfYear(now), 1);
    }
  }
}

export function SalesGoalProgress({ 
  current, 
  target, 
  label = 'Monthly Goal',
  className,
  goalPeriod = 'monthly'
}: SalesGoalProgressProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = percentage >= 100;
  const remaining = Math.max(target - current, 0);

  // Pace calculation
  const elapsedFraction = getElapsedFraction(goalPeriod);
  const expectedPercentage = elapsedFraction * 100;
  const actualPercentage = target > 0 ? (current / target) * 100 : 0;
  const diff = actualPercentage - expectedPercentage;

  const paceStatus = diff >= 5 ? 'ahead' : diff <= -5 ? 'behind' : 'on-track';
  const daysLeft = getRemainingDays(goalPeriod);
  const neededPerDay = remaining / daysLeft;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Target className={cn(
            'w-4 h-4',
            isComplete ? 'text-chart-2' : 'text-muted-foreground'
          )} />
          <span className="font-medium">{label}</span>
          <MetricInfoTooltip description="Progress toward your configured sales target. Percentage = (Current Revenue ÷ Target) × 100." />
        </div>
        <span className={cn(
          'text-xs font-medium',
          isComplete ? 'text-chart-2' : 'text-muted-foreground'
        )}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn(
          'h-2',
          isComplete && '[&>div]:bg-chart-2'
        )} 
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <BlurredAmount>${current.toLocaleString()} earned</BlurredAmount>
        {isComplete ? (
          <span className="text-chart-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Goal reached!
          </span>
        ) : (
          <BlurredAmount>${remaining.toLocaleString()} to go</BlurredAmount>
        )}
      </div>

      {/* Pace indicator */}
      {!isComplete && target > 0 && (
        <div className={cn(
          'flex items-center gap-1.5 text-[11px]',
          paceStatus === 'ahead' && 'text-chart-2',
          paceStatus === 'on-track' && 'text-muted-foreground',
          paceStatus === 'behind' && 'text-destructive'
        )}>
          {paceStatus === 'ahead' && (
            <>
              <TrendingUp className="w-3 h-3" />
              <span>On pace to surpass goal</span>
            </>
          )}
          {paceStatus === 'on-track' && (
            <>
              <Target className="w-3 h-3" />
              <span>On track</span>
            </>
          )}
          {paceStatus === 'behind' && (
            <>
              <TrendingDown className="w-3 h-3" />
              <span>Behind pace · <BlurredAmount>${neededPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day</BlurredAmount> needed to hit goal</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}