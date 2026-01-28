import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarPlus, UserPlus, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNewBookings } from '@/hooks/useNewBookings';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

interface NewBookingsCardProps {
  filterContext?: FilterContext;
}

export function NewBookingsCard({ filterContext }: NewBookingsCardProps) {
  const { data, isLoading } = useNewBookings();

  // Trend icon based on percent change
  const TrendIcon = data?.percentChange && data.percentChange > 0 ? TrendingUp 
    : data?.percentChange && data.percentChange < 0 ? TrendingDown 
    : Minus;
  const trendColor = data?.percentChange && data.percentChange > 0 ? 'text-green-500' 
    : data?.percentChange && data.percentChange < 0 ? 'text-red-500' 
    : 'text-muted-foreground';

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded-lg">
            <CalendarPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-display text-sm tracking-wide">NEW BOOKINGS</h2>
              <p className="text-xs text-muted-foreground">Appointments created</p>
            </div>
            <CommandCenterVisibilityToggle elementKey="new_bookings" elementName="New Bookings" />
          </div>
        </div>
        {filterContext && (
          <AnalyticsFilterBadge 
            locationId={filterContext.locationId} 
            dateRange={filterContext.dateRange} 
          />
        )}
      </div>

      {/* Hero: Total Booked Today */}
      <div className="text-center mb-6">
        {isLoading ? (
          <Skeleton className="h-12 w-16 mx-auto" />
        ) : (
          <p className="text-4xl font-display tabular-nums">{data?.bookedToday || 0}</p>
        )}
        <div className="flex items-center gap-1 justify-center mt-1">
          <p className="text-sm text-muted-foreground">Booked Today</p>
          <MetricInfoTooltip description="Total new appointments created today (by creation date)." />
        </div>
      </div>

      {/* Breakdown: New vs Returning */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-center mb-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-10 mx-auto" />
          ) : (
            <p className="text-xl font-display tabular-nums">{data?.newClientToday || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">New Clients</p>
            <MetricInfoTooltip description="Bookings today from first-time clients." />
          </div>
        </div>

        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-center mb-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-10 mx-auto" />
          ) : (
            <p className="text-xl font-display tabular-nums">{data?.returningClientToday || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Returning Clients</p>
            <MetricInfoTooltip description="Bookings today from repeat clients." />
          </div>
        </div>
      </div>

      {/* 30-Day Comparison */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Last 30 Days:</span>
            {isLoading ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <span className="font-display tabular-nums">{data?.last30Days || 0}</span>
            )}
          </div>
          {!isLoading && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm">
                {data?.percentChange && data.percentChange > 0 ? '+' : ''}{data?.percentChange || 0}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs prev 30d</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
