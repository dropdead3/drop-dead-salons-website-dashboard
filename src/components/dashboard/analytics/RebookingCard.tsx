import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { Repeat, AlertCircle } from 'lucide-react';
import { useRebookingRate } from '@/hooks/useRebookingRate';
import { cn } from '@/lib/utils';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';

export interface RebookingCardProps {
  filterContext: FilterContext;
  dateFrom: string;
  dateTo: string;
  locationId: string;
}

export function RebookingCard({ filterContext, dateFrom, dateTo, locationId }: RebookingCardProps) {
  const locationFilter = locationId === 'all' ? undefined : locationId;
  const { data, isLoading, isError, refetch } = useRebookingRate(dateFrom, dateTo, locationFilter);

  if (isError) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load rebooking data.</span>
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
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-16 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const rebookRate = data?.rebookRate ?? 0;
  const rebooked = data?.rebooked ?? 0;
  const completed = data?.completed ?? 0;

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              data-pinnable-anchor
              className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg shrink-0"
            >
              <Repeat className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm tracking-wide text-muted-foreground uppercase truncate">
                Rebooking Rate
              </h3>
              <MetricInfoTooltip description="Percentage of completed appointments where the client booked a future appointment. Calculated as rebooked clients / total completed appointments x 100." />
            </div>
          </div>
          <AnalyticsFilterBadge
            locationId={filterContext.locationId}
            dateRange={filterContext.dateRange}
          />
        </div>
        <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
          <p
            className={cn(
              'font-medium text-2xl tabular-nums',
              rebookRate >= 50 && 'text-green-600 dark:text-green-400'
            )}
          >
            {rebookRate.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {rebooked} of {completed} completed visits rebooked
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
