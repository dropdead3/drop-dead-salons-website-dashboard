import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { getDaysInMonth, getDaysInYear, getDayOfYear, startOfWeek, endOfWeek, endOfMonth, endOfYear, differenceInDays, addDays, format, getDay } from 'date-fns';
import type { HoursJson, HolidayClosure } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZuraAvatar } from '@/components/ui/ZuraAvatar';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { RecoveryPlanActions } from './RecoveryPlanActions';

interface SalesGoalProgressProps {
  current: number;
  target: number;
  label?: string;
  className?: string;
  goalPeriod?: 'weekly' | 'monthly' | 'yearly';
  hoursJson?: HoursJson | null;
  holidayClosures?: HolidayClosure[] | null;
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

const dayIndexMap: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const dayNameByIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function getRemainingCalendarDays(period: 'weekly' | 'monthly' | 'yearly'): number {
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

function getOpenDaysRemaining(
  period: 'weekly' | 'monthly' | 'yearly',
  hoursJson?: HoursJson | null,
  holidayClosures?: HolidayClosure[] | null
): { openDays: number; isLocationAware: boolean } {
  if (!hoursJson) {
    return { openDays: getRemainingCalendarDays(period), isLocationAware: false };
  }

  const now = new Date();
  let periodEnd: Date;
  switch (period) {
    case 'weekly':
      periodEnd = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      periodEnd = endOfMonth(now);
      break;
    case 'yearly':
      periodEnd = endOfYear(now);
      break;
  }

  const holidaySet = new Set(
    (holidayClosures || []).map(h => h.date)
  );

  let openCount = 0;
  let current = now;
  while (current <= periodEnd) {
    const dayOfWeek = getDay(current);
    const dayName = dayNameByIndex[dayOfWeek];
    const dayConfig = hoursJson[dayName];
    const dateStr = format(current, 'yyyy-MM-dd');

    const isClosed = dayConfig?.closed === true;
    const isHoliday = holidaySet.has(dateStr);

    if (!isClosed && !isHoliday) {
      openCount++;
    }
    current = addDays(current, 1);
  }

  return { openDays: Math.max(openCount, 1), isLocationAware: true };
}

export function SalesGoalProgress({ 
  current, 
  target, 
  label = 'Monthly Goal',
  className,
  goalPeriod = 'monthly',
  hoursJson,
  holidayClosures,
}: SalesGoalProgressProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState('');

  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = percentage >= 100;
  const remaining = Math.max(target - current, 0);

  const elapsedFraction = getElapsedFraction(goalPeriod);
  const expectedPercentage = elapsedFraction * 100;
  const actualPercentage = target > 0 ? (current / target) * 100 : 0;
  const diff = actualPercentage - expectedPercentage;

  const paceStatus = diff >= 5 ? 'ahead' : diff <= -5 ? 'behind' : 'on-track';
  const { openDays: daysLeft, isLocationAware } = getOpenDaysRemaining(goalPeriod, hoursJson, holidayClosures);
  const neededPerDay = remaining / daysLeft;

  const handleGetBackOnTrack = async () => {
    setLoading(true);
    setDialogOpen(true);
    setGuidance('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-insight-guidance', {
        body: {
          type: 'insight',
          category: 'goal-recovery',
          title: `${label} Recovery Plan`,
          description: `We are behind pace on our ${goalPeriod} sales goal. Current revenue: $${current.toLocaleString()}. Target: $${target.toLocaleString()}. Shortfall: $${remaining.toLocaleString()}. We need $${neededPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} per day over the next ${daysLeft} open business day${daysLeft !== 1 ? 's' : ''} to hit the goal. Goal period: ${goalPeriod}. Provide specific, immediate action items including promotions, ad campaigns, rebooking pushes, retail initiatives, and upselling strategies calibrated to close this gap.`,
        },
      });
      if (error) throw error;
      setGuidance(data?.guidance || 'Unable to generate guidance at this time.');
    } catch {
      setGuidance('Something went wrong generating your recovery plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <span>Behind pace · <BlurredAmount>${neededPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day</BlurredAmount> needed{isLocationAware ? ` (${daysLeft} open day${daysLeft !== 1 ? 's' : ''} left)` : ''}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGetBackOnTrack}
                disabled={loading}
                className="h-auto py-0.5 px-2 text-[11px] text-muted-foreground hover:text-foreground ml-1 gap-1"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ZuraAvatar size="sm" className="h-4 w-4 text-[7px]" />}
                Get back on track
              </Button>
            </>
          )}
        </div>
      )}

      {/* Zura recovery dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" overlayClassName="backdrop-blur-sm bg-black/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZuraAvatar size="sm" />
              {label} Recovery Plan
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-4 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:mt-4 [&_h3]:mb-2 [&_li]:leading-relaxed">
                <ReactMarkdown>{guidance}</ReactMarkdown>
              </div>
            )}
          </ScrollArea>
          {!loading && guidance && (
            <RecoveryPlanActions
              title={`${label} Recovery Plan`}
              content={guidance}
              goalPeriod={goalPeriod}
              targetRevenue={target}
              currentRevenue={current}
              shortfall={remaining}
            />
          )}
          <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
            Powered by Zura AI
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}