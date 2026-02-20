import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { Layers, AlertCircle } from 'lucide-react';
import { useServiceMix } from '@/hooks/useSalesData';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';

export interface ServiceMixCardProps {
  filterContext: FilterContext;
  dateFrom: string;
  dateTo: string;
  locationId: string;
}

export function ServiceMixCard({ filterContext, dateFrom, dateTo, locationId }: ServiceMixCardProps) {
  const locationFilter = locationId === 'all' ? undefined : locationId;
  const { data: mix, isLoading, isError, refetch } = useServiceMix(dateFrom, dateTo, locationFilter);
  const { formatCurrencyWhole } = useFormatCurrency();

  if (isError) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load service mix.</span>
          </div>
          <Button variant="outline" size={tokens.button.card} className="mt-3" onClick={() => refetch()}>
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
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = mix ?? [];

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              data-pinnable-anchor
              className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg shrink-0"
            >
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm tracking-wide text-muted-foreground uppercase truncate">
                Service Mix
              </h3>
              <MetricInfoTooltip description="Revenue distribution across service categories for the selected period. Shows each category's share of total service revenue to highlight your most profitable service lines." />
            </div>
          </div>
          <AnalyticsFilterBadge
            locationId={filterContext.locationId}
            dateRange={filterContext.dateRange}
          />
        </div>
        <div className="space-y-2">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.category}
              className={cn(
                'flex justify-between items-center py-2 px-3 rounded-lg border border-border/50',
                'bg-muted/30'
              )}
            >
              <div className="min-w-0">
                <p className="text-sm truncate">{item.category}</p>
                <p className="text-xs text-muted-foreground">{item.count} appointments</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="tabular-nums text-sm">
                  <BlurredAmount>
                    {formatCurrencyWhole(item.revenue)}
                  </BlurredAmount>
                </p>
                <p className="text-xs text-muted-foreground">{item.percentRevenue.toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
