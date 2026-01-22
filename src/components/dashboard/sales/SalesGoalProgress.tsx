import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';

interface SalesGoalProgressProps {
  current: number;
  target: number;
  label?: string;
  className?: string;
}

export function SalesGoalProgress({ 
  current, 
  target, 
  label = 'Monthly Goal',
  className 
}: SalesGoalProgressProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = percentage >= 100;
  const remaining = Math.max(target - current, 0);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Target className={cn(
            'w-4 h-4',
            isComplete ? 'text-chart-2' : 'text-muted-foreground'
          )} />
          <span className="font-medium">{label}</span>
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
    </div>
  );
}
