import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  TrendingDown,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface LocationData {
  location_id: string;
  name: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  totalServices: number;
  totalProducts: number;
}

interface LocationComparisonProps {
  locations: LocationData[];
  isLoading?: boolean;
  filterContext?: FilterContext;
}

export function LocationComparison({ locations, isLoading, filterContext }: LocationComparisonProps) {
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [locations]);

  const maxRevenue = useMemo(() => {
    return Math.max(...locations.map(l => l.totalRevenue), 1);
  }, [locations]);

  const totalRevenue = useMemo(() => {
    return locations.reduce((sum, l) => sum + l.totalRevenue, 0);
  }, [locations]);

  const chartData = useMemo(() => {
    return sortedLocations.map((location, idx) => ({
      name: location.name,
      value: location.totalRevenue,
      percentage: totalRevenue > 0 
        ? ((location.totalRevenue / totalRevenue) * 100).toFixed(0)
        : 0,
      color: COLORS[idx % COLORS.length],
    }));
  }, [sortedLocations, totalRevenue]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locations.length < 2) {
    return null;
  }

  const leader = sortedLocations[0];
  const trailing = sortedLocations[sortedLocations.length - 1];
  const gap = leader.totalRevenue - trailing.totalRevenue;
  const gapPercent = trailing.totalRevenue > 0 
    ? ((gap / trailing.totalRevenue) * 100).toFixed(0)
    : '∞';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-base tracking-wide">LOCATION COMPARISON</span>
          </div>
          <div className="flex items-center gap-2">
            {filterContext && (
              <AnalyticsFilterBadge 
                locationId={filterContext.locationId} 
                dateRange={filterContext.dateRange} 
              />
            )}
            <Badge variant="outline" className="font-normal">
              ${totalRevenue.toLocaleString()} total
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side by side comparison */}
        <div className="grid grid-cols-2 gap-4">
          {sortedLocations.slice(0, 2).map((location, idx) => {
            const isLeader = idx === 0;
            const sharePercent = totalRevenue > 0 
              ? ((location.totalRevenue / totalRevenue) * 100).toFixed(0)
              : 0;
            
            return (
              <div 
                key={location.location_id} 
                className={cn(
                  'p-4 rounded-lg border',
                  isLeader ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">{location.name}</span>
                  {isLeader ? (
                    <Badge className="bg-primary/10 text-primary border-0 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Leader
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -{gapPercent}%
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-display mb-2">
                  ${location.totalRevenue.toLocaleString()}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Share of total</span>
                    <span>{sharePercent}%</span>
                  </div>
                  <Progress value={Number(sharePercent)} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-center">
                  <div>
                    <p className="text-lg font-display">{location.totalServices}</p>
                    <p className="text-xs text-muted-foreground">Services</p>
                  </div>
                  <div>
                    <p className="text-lg font-display">{location.totalProducts}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <p className="text-lg font-display">
                      ${location.totalTransactions > 0 
                        ? Math.round(location.totalRevenue / location.totalTransactions)
                        : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Share Bar */}
        <div className="space-y-2">
          <div className="flex h-8 rounded-lg overflow-hidden">
            {chartData.map((entry) => {
              const pct = totalRevenue > 0 ? (entry.value / totalRevenue) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <Tooltip key={entry.name}>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full flex items-center justify-center text-xs font-medium transition-all cursor-default"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: entry.color,
                        color: 'hsl(var(--background))',
                        minWidth: pct > 5 ? undefined : '24px',
                      }}
                    >
                      {pct >= 15 && `${entry.percentage}%`}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{entry.name}: ${entry.value.toLocaleString()} ({entry.percentage}%)</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-medium tabular-nums">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
