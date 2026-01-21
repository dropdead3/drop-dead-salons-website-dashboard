import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FunnelStage {
  day: number;
  label: string;
}

interface EnrollmentData {
  current_day: number;
  status: string;
}

interface ProgramCompletionFunnelProps {
  enrollments: EnrollmentData[];
  stages?: FunnelStage[];
  className?: string;
}

const DEFAULT_STAGES: FunnelStage[] = [
  { day: 1, label: 'Started' },
  { day: 7, label: 'Week 1' },
  { day: 14, label: 'Week 2' },
  { day: 21, label: 'Week 3' },
  { day: 30, label: 'Month 1' },
  { day: 45, label: 'Halfway' },
  { day: 60, label: 'Week 9' },
  { day: 75, label: 'Finished' },
];

export function ProgramCompletionFunnel({
  enrollments,
  stages = DEFAULT_STAGES,
  className,
}: ProgramCompletionFunnelProps) {
  const funnelData = useMemo(() => {
    return stages.map((stage, index) => {
      const reached = enrollments.filter(
        e => e.current_day >= stage.day || e.status === 'completed'
      ).length;
      const percentage = enrollments.length > 0 
        ? Math.round((reached / enrollments.length) * 100) 
        : 0;
      
      const previousPercentage = index > 0 
        ? Math.round(
            (enrollments.filter(
              e => e.current_day >= stages[index - 1].day || e.status === 'completed'
            ).length / enrollments.length) * 100
          )
        : 100;
      
      const dropOff = previousPercentage - percentage;

      return {
        ...stage,
        reached,
        percentage,
        dropOff,
        total: enrollments.length,
      };
    });
  }, [enrollments, stages]);

  if (enrollments.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No enrollment data available
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {funnelData.map((stage, index) => (
        <div key={stage.day} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground text-xs">Day {stage.day}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {stage.reached} / {stage.total}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs tabular-nums",
                  stage.percentage >= 70 && "bg-green-500/10 text-green-600 border-green-500/30",
                  stage.percentage >= 40 && stage.percentage < 70 && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                  stage.percentage < 40 && "bg-red-500/10 text-red-600 border-red-500/30"
                )}
              >
                {stage.percentage}%
              </Badge>
            </div>
          </div>
          
          <div className="relative">
            <Progress value={stage.percentage} className="h-3" />
            
            {/* Drop-off indicator */}
            {index > 0 && stage.dropOff > 0 && (
              <div className="absolute -right-1 -top-1">
                <span 
                  className={cn(
                    "text-[10px] px-1 rounded",
                    stage.dropOff > 20 
                      ? "bg-red-500/20 text-red-600" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  -{stage.dropOff}%
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Summary */}
      <div className="pt-4 border-t mt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-display">{enrollments.length}</p>
            <p className="text-xs text-muted-foreground">Total Started</p>
          </div>
          <div>
            <p className="text-2xl font-display">
              {enrollments.filter(e => e.status === 'completed').length}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-display">
              {funnelData[funnelData.length - 1]?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
