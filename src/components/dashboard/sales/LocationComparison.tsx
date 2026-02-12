import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  TrendingDown,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const COLOR_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
];

const MAX_BAR_SEGMENTS = 5;
const MAX_VISIBLE_OTHERS = 5;

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
  const [showOthers, setShowOthers] = useState(false);
  const [showAllOthers, setShowAllOthers] = useState(false);

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
        : '0',
      color: COLORS[idx % COLORS.length],
      colorVar: COLOR_VARS[idx % COLOR_VARS.length],
    }));
  }, [sortedLocations, totalRevenue]);

  const { displayData, othersEntry, othersLocations } = useMemo(() => {
    const top = chartData.slice(0, MAX_BAR_SEGMENTS);
    const rest = chartData.slice(MAX_BAR_SEGMENTS);
    const othersValue = rest.reduce((sum, l) => sum + l.value, 0);
    const othersPct = totalRevenue > 0 ? ((othersValue / totalRevenue) * 100).toFixed(0) : '0';
    const entry = rest.length > 0 ? {
      name: 'Others',
      value: othersValue,
      percentage: othersPct,
      color: 'hsl(var(--muted-foreground))',
      colorVar: '--muted-foreground',
      count: rest.length,
    } : null;
    return { displayData: top, othersEntry: entry, othersLocations: rest };
  }, [chartData, totalRevenue]);

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
            const locationColor = COLORS[idx % COLORS.length];
            const sharePercent = totalRevenue > 0 
              ? ((location.totalRevenue / totalRevenue) * 100).toFixed(0)
              : 0;
            
            return (
              <div 
                key={location.location_id} 
                className={cn(
                  'p-4 rounded-lg border relative overflow-hidden',
                  isLeader ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/40'
                )}
              >
                {/* Color accent bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: locationColor }}
                />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: locationColor }} />
                      <span className="text-sm font-medium truncate">{location.name}</span>
                    </div>
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
              </div>
            );
          })}
        </div>

        {/* Revenue Share Bar */}
        <div className="space-y-2.5">
           <div className="flex h-10 rounded-xl overflow-hidden border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            {[...displayData, ...(othersEntry ? [othersEntry] : [])].map((entry, idx) => {
              const pct = totalRevenue > 0 ? (entry.value / totalRevenue) * 100 : 0;
              if (pct <= 0) return null;
              const isOthers = entry.name === 'Others';
              const allEntries = [...displayData, ...(othersEntry ? [othersEntry] : [])];
              const isLast = idx === allEntries.length - 1;
              const cssVar = (entry as any).colorVar || '--chart-5';
              const opacity = isOthers ? 0.25 : 0.45;
              return (
                <Tooltip key={entry.name}>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full flex items-center justify-center text-xs transition-all cursor-default relative overflow-hidden"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `hsl(var(${cssVar}) / ${opacity})`,
                        borderRight: isLast ? 'none' : `1px solid hsl(var(--border) / 0.15)`,
                        minWidth: pct > 5 ? undefined : '24px',
                      }}
                    >
                      {/* Glass top highlight */}
                      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08] pointer-events-none" />
                      <span className="relative z-10 font-display tracking-wide text-[11px] font-medium text-foreground/70">
                        {pct >= 12 && `${entry.percentage}%`}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isOthers ? (
                      <p>{'count' in entry ? (entry as any).count : 0} other locations: ${entry.value.toLocaleString()} ({entry.percentage}%)</p>
                    ) : (
                      <p>{entry.name}: ${entry.value.toLocaleString()} ({entry.percentage}%)</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {[...displayData, ...(othersEntry ? [othersEntry] : [])].map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-display tabular-nums">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Others Expandable Detail */}
        {othersEntry && othersLocations.length > 0 && (
          <div className="border rounded-lg">
            <button
              onClick={() => setShowOthers(!showOthers)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{othersEntry.count} other locations — ${othersEntry.value.toLocaleString()}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', showOthers && 'rotate-180')} />
            </button>
            {showOthers && (
              <div className="border-t px-4 py-2">
                {(() => {
                  const visibleList = showAllOthers ? othersLocations : othersLocations.slice(0, MAX_VISIBLE_OTHERS);
                  const useScroll = showAllOthers && othersLocations.length > 8;
                  const rows = (
                    <div className="space-y-1.5">
                      {visibleList.map((loc) => (
                        <div key={loc.name} className="flex items-center justify-between py-1 text-sm">
                          <span className="truncate">{loc.name}</span>
                          <span className="text-muted-foreground tabular-nums ml-4 shrink-0">
                            ${loc.value.toLocaleString()} ({loc.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                  return (
                    <>
                      {useScroll ? <ScrollArea className="max-h-[280px]">{rows}</ScrollArea> : rows}
                      {othersLocations.length > MAX_VISIBLE_OTHERS && (
                        <button
                          onClick={() => setShowAllOthers(!showAllOthers)}
                          className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ChevronDown className={cn('w-3 h-3 transition-transform', showAllOthers && 'rotate-180')} />
                          {showAllOthers ? 'Show less' : `Show all ${othersLocations.length} locations`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
