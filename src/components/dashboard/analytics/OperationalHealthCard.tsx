import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { XCircle, CalendarX, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppointmentSummary } from '@/hooks/useOperationalAnalytics';
import { cn } from '@/lib/utils';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';

export interface OperationalHealthCardProps {
  filterContext: FilterContext;
  dateFrom: string;
  dateTo: string;
  locationId: string;
}

export function OperationalHealthCard({
  filterContext,
  dateFrom,
  dateTo,
  locationId,
}: OperationalHealthCardProps) {
  const locationFilter = locationId === 'all' ? undefined : locationId;
  const { data: summary, isLoading, isError, refetch } = useAppointmentSummary(dateFrom, dateTo, locationFilter);

  if (isError) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load operational data.</span>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const noShowRate = summary?.noShowRate ?? 0;
  const cancellationRate = summary?.cancellationRate ?? 0;
  const completionRate = summary?.completionRate ?? 0;

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              data-pinnable-anchor
              className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg shrink-0"
            >
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm tracking-wide text-muted-foreground uppercase truncate">
                Operational Health
              </h3>
              <MetricInfoTooltip description="Tracks no-show rate, cancellation rate, and completion rate for appointments in the selected period. Rates are calculated as a percentage of total scheduled appointments." />
            </div>
          </div>
          <AnalyticsFilterBadge
            locationId={filterContext.locationId}
            dateRange={filterContext.dateRange}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs text-muted-foreground">No-Show Rate</span>
            </div>
            <p
              className={cn(
                'font-medium text-xl tabular-nums',
                noShowRate > 5 && 'text-red-600 dark:text-red-400'
              )}
            >
              {noShowRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <CalendarX className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-muted-foreground">Cancellation Rate</span>
            </div>
            <p className="font-medium text-xl tabular-nums">{cancellationRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-muted-foreground">Completion Rate</span>
            </div>
            <p className="font-medium text-xl tabular-nums">{completionRate.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
