import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CalendarPlus, UserPlus, RefreshCw, TrendingUp, TrendingDown, Minus, MapPin, CalendarCheck } from 'lucide-react';
import { useNewBookings } from '@/hooks/useNewBookings';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { NewBookingsDrilldown } from './NewBookingsDrilldown';

import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import type { DateRangeType } from '@/components/dashboard/PinnedAnalyticsCard';

const RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Booked Today',
  yesterday: 'Booked Yesterday',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  todayToEom: 'Today to End of Month',
  todayToPayday: 'Today to Next Pay Day',
};

interface NewBookingsCardProps {
  filterContext?: FilterContext;
}

export function NewBookingsCard({ filterContext }: NewBookingsCardProps) {
  const dateRange = (filterContext?.dateRange ?? 'today') as DateRangeType;
  const { data, isLoading } = useNewBookings(filterContext?.locationId, dateRange);
  const [drilldown, setDrilldown] = useState<'new' | 'returning' | null>(null);

  const showLocationBreakdown = !filterContext?.locationId || filterContext.locationId === 'all';
  const heroLabel = RANGE_LABELS[dateRange] || 'Booked';

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
              <p className="text-xs text-muted-foreground">Appointments scheduled</p>
            </div>
          </div>
        </div>
        {filterContext && (
          <AnalyticsFilterBadge 
            locationId={filterContext.locationId} 
            dateRange={filterContext.dateRange} 
          />
        )}
      </div>

      {/* Hero: Total Booked in Range */}
      <div className="text-center mb-6">
        {isLoading ? (
          <Skeleton className="h-12 w-16 mx-auto" />
        ) : (
          <p className="text-4xl font-display tabular-nums">{data?.bookedInRange || 0}</p>
        )}
        <div className="flex items-center gap-1 justify-center mt-1">
          <p className="text-sm text-muted-foreground">{heroLabel}</p>
          <MetricInfoTooltip description={`Total appointments scheduled for the selected period (${heroLabel.toLowerCase()}).`} />
        </div>
      </div>

      {/* Breakdown: New vs Returning */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          type="button"
          onClick={() => setDrilldown('new')}
          className="text-center p-4 bg-muted/30 rounded-lg cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <div className="flex justify-center mb-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-10 mx-auto" />
          ) : (
            <p className="text-xl font-display tabular-nums">{data?.newClientCount || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">New Clients</p>
            <MetricInfoTooltip description="Bookings from first-time clients in this period." />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDrilldown('returning')}
          className="text-center p-4 bg-muted/30 rounded-lg cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <div className="flex justify-center mb-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-10 mx-auto" />
          ) : (
            <p className="text-xl font-display tabular-nums">{data?.returningClientCount || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Returning Clients</p>
            <MetricInfoTooltip description="Bookings from repeat clients in this period." />
          </div>
        </button>
      </div>

      {/* After-Service Rebook Rate */}
      {!isLoading && data?.rebookRate !== undefined && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className={`w-5 h-5 ${
              data.rebookRate !== null && data.rebookRate >= 70 ? 'text-emerald-600' 
              : data.rebookRate !== null && data.rebookRate >= 40 ? 'text-amber-500' 
              : 'text-red-500'
            }`} />
            <span className="text-sm font-medium">After-Service Rebook</span>
            <MetricInfoTooltip description="Percentage of returning clients serviced in this period who rebooked their next appointment." />
          </div>
          {data.rebookRate !== null ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {data.rebookedAtCheckoutInRange} of {data.returningServicedInRange} rebooked
                  {(data.returningServicedInRange! - data.rebookedAtCheckoutInRange!) > 0 && (
                    <span className="text-red-400"> · {data.returningServicedInRange! - data.rebookedAtCheckoutInRange!} did not</span>
                  )}
                </span>
                <span className="font-display tabular-nums text-lg">{data.rebookRate}%</span>
              </div>
              <Progress 
                value={data.rebookRate} 
                className="h-2" 
                indicatorClassName={
                  data.rebookRate >= 70 ? 'bg-emerald-500' 
                  : data.rebookRate >= 40 ? 'bg-amber-500' 
                  : 'bg-red-500'
                }
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No returning clients serviced in this period</p>
          )}
        </div>
      )}

      {/* Location Breakdown */}
      {showLocationBreakdown && data?.locationBreakdown && data.locationBreakdown.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              By Location
            </span>
          </div>
          <div className="space-y-2">
            {data.locationBreakdown.map(loc => (
              <div
                key={loc.locationId}
                className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
              >
                <span className="text-sm">{loc.name}</span>
                <span className="font-display tabular-nums">{loc.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Stylist Drill-Down Dialog */}
      <NewBookingsDrilldown
        mode={drilldown}
        onClose={() => setDrilldown(null)}
        newClientsByStaff={data?.newClientsByStaff || []}
        returningClientsByStaff={data?.returningClientsByStaff || []}
      />
    </Card>
  );
}
