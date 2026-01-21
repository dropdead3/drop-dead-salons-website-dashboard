import { CheckCircle2, Circle, Lock, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeekNode {
  weekNumber: number;
  title: string;
  startDay: number;
  endDay: number;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
}

interface ProgramJourneyMapProps {
  currentDay: number;
  totalDays?: number;
  weeks?: Array<{
    week_number: number;
    title: string;
    start_day: number;
    end_day: number;
  }>;
  className?: string;
}

export function ProgramJourneyMap({ 
  currentDay, 
  totalDays = 75,
  weeks = [],
  className 
}: ProgramJourneyMapProps) {
  // Generate default weeks if not provided
  const weekNodes: WeekNode[] = weeks.length > 0 
    ? weeks.map(w => ({
        weekNumber: w.week_number,
        title: w.title,
        startDay: w.start_day,
        endDay: w.end_day,
        status: getWeekStatus(currentDay, w.start_day, w.end_day),
      }))
    : Array.from({ length: 11 }, (_, i) => {
        const weekNumber = i + 1;
        const startDay = i * 7 + 1;
        const endDay = Math.min((i + 1) * 7, totalDays);
        return {
          weekNumber,
          title: `Week ${weekNumber}`,
          startDay,
          endDay,
          status: getWeekStatus(currentDay, startDay, endDay),
        };
      });

  function getWeekStatus(
    current: number, 
    start: number, 
    end: number
  ): 'completed' | 'current' | 'upcoming' | 'locked' {
    if (current > end) return 'completed';
    if (current >= start && current <= end) return 'current';
    if (current < start && current > start - 7) return 'upcoming';
    return 'locked';
  }

  const completedWeeks = weekNodes.filter(w => w.status === 'completed').length;
  const progressPercent = (completedWeeks / weekNodes.length) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>Journey Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{completedWeeks}/{weekNodes.length} weeks</span>
          {completedWeeks === weekNodes.length && (
            <Trophy className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="relative min-w-max">
          {/* Progress Line */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-muted rounded-full">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Week Nodes */}
          <div className="relative flex justify-between px-2">
            {weekNodes.map((week) => (
              <div key={week.weekNumber} className="flex flex-col items-center">
                <WeekNodeIcon status={week.status} weekNumber={week.weekNumber} />
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    week.status === 'current' && "text-primary",
                    week.status === 'completed' && "text-muted-foreground",
                    week.status === 'locked' && "text-muted-foreground/50"
                  )}>
                    Week {week.weekNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Days {week.startDay}-{week.endDay}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden space-y-1">
        {weekNodes.map((week, index) => (
          <div key={week.weekNumber} className="flex items-center gap-3">
            <div className="relative flex flex-col items-center">
              <WeekNodeIcon status={week.status} weekNumber={week.weekNumber} size="sm" />
              {index < weekNodes.length - 1 && (
                <div className={cn(
                  "w-0.5 h-6 mt-1",
                  week.status === 'completed' ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
            <div className="flex-1 flex items-center justify-between py-1">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  week.status === 'current' && "text-primary",
                  week.status === 'locked' && "text-muted-foreground/50"
                )}>
                  {week.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Days {week.startDay}-{week.endDay}
                </p>
              </div>
              {week.status === 'current' && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  Current
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekNodeIcon({ 
  status, 
  weekNumber,
  size = 'md' 
}: { 
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  weekNumber: number;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';

  switch (status) {
    case 'completed':
      return (
        <div className={cn(
          sizeClasses,
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center"
        )}>
          <CheckCircle2 className={iconSize} />
        </div>
      );
    case 'current':
      return (
        <div className={cn(
          sizeClasses,
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-primary/20"
        )}>
          <span className="text-xs font-bold">{weekNumber}</span>
        </div>
      );
    case 'upcoming':
      return (
        <div className={cn(
          sizeClasses,
          "rounded-full bg-muted border-2 border-primary/30 flex items-center justify-center"
        )}>
          <Circle className={cn(iconSize, "text-muted-foreground")} />
        </div>
      );
    case 'locked':
    default:
      return (
        <div className={cn(
          sizeClasses,
          "rounded-full bg-muted flex items-center justify-center"
        )}>
          <Lock className={cn(iconSize, "text-muted-foreground/50")} />
        </div>
      );
  }
}
