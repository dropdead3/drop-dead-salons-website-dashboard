import { useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, ArrowRight, BarChart3 } from 'lucide-react';
import { useBookingPipelineByLocation, type LocationPipelineStatus, type LocationPipeline } from '@/hooks/useBookingPipelineByLocation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const MAX_VISIBLE = 5;

const STATUS_CONFIG: Record<LocationPipelineStatus, { dot: string; chip: string; bar: string; order: number }> = {
  critical: { dot: 'bg-destructive', chip: 'bg-destructive/15 text-destructive', bar: 'bg-destructive', order: 0 },
  slowing: { dot: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-600', bar: 'bg-amber-500', order: 1 },
  healthy: { dot: 'bg-emerald-500', chip: 'bg-emerald-500/15 text-emerald-600', bar: 'bg-emerald-500', order: 2 },
  no_data: { dot: 'bg-muted-foreground/40', chip: 'bg-muted-foreground/15 text-muted-foreground', bar: 'bg-muted-foreground/40', order: 3 },
};

type SortBy = 'severity' | 'ratio-asc' | 'ratio-desc' | 'name';

const STATUS_FILL: Record<LocationPipelineStatus, string> = {
  critical: 'hsl(var(--destructive))',
  slowing: 'hsl(45, 93%, 47%)',
  healthy: 'hsl(152, 69%, 41%)',
  no_data: 'hsl(var(--muted-foreground) / 0.4)',
};

function PipelineChartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-display text-xs tracking-wide">{d.locationName}</p>
      <p className="text-muted-foreground text-xs">
        {d.forwardCount} next 14d vs {d.baselineCount} trailing
      </p>
      <p className="text-xs tabular-nums">Ratio: {Math.round(d.ratio * 100)}%</p>
    </div>
  );
}

function PipelineChart({ locations }: { locations: LocationPipeline[] }) {
  const [isOpen, setIsOpen] = useState(true);

  const chartData = locations.map(loc => ({
    ...loc,
    displayRatio: Math.min(Math.round(loc.ratio * 100), 120),
    ratioLabel: `${Math.round(loc.ratio * 100)}%`,
  }));

  const chartHeight = Math.max(180, locations.length * 36);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
        <BarChart3 className="w-3.5 h-3.5" />
        <span className="font-display tracking-wide">PIPELINE HEALTH BY LOCATION</span>
        <ChevronDown className={cn('w-3.5 h-3.5 ml-auto transition-transform', isOpen && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-3 bg-muted/30 rounded-lg border border-border/50 p-4"
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 120]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="locationName" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
              <ReferenceLine x={70} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: '70%', position: 'top', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <ReferenceLine x={90} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: '90%', position: 'top', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <RechartsTooltip content={<PipelineChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Bar dataKey="displayRatio" radius={[0, 4, 4, 0]} barSize={18}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_FILL[entry.status]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface BookingPipelineContentProps {
  locationId?: string;
  dateRange: string;
}

export function BookingPipelineContent({ locationId, dateRange }: BookingPipelineContentProps) {
  const { locations, summary, isLoading } = useBookingPipelineByLocation(locationId);
  const [sortBy, setSortBy] = useState<SortBy>('severity');
  const [activeFilters, setActiveFilters] = useState<Set<LocationPipelineStatus>>(
    new Set(['critical', 'slowing', 'healthy', 'no_data'])
  );
  const [showAll, setShowAll] = useState(false);

  const isSingleLocation = !!locationId || locations.length <= 1;

  const toggleFilter = (status: LocationPipelineStatus) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const sorted = useMemo(() => {
    const filtered = locations.filter(l => activeFilters.has(l.status));
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order;
        case 'ratio-asc':
          return a.ratio - b.ratio;
        case 'ratio-desc':
          return b.ratio - a.ratio;
        case 'name':
          return a.locationName.localeCompare(b.locationName);
        default:
          return 0;
      }
    });
  }, [locations, activeFilters, sortBy]);

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE);
  const hasMore = sorted.length > MAX_VISIBLE;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-display text-lg">No locations found</p>
        <p className="text-sm mt-1">Add locations to see booking pipeline data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Scoreboard + Sort */}
      {!isSingleLocation && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([['critical', summary.critical], ['slowing', summary.slowing], ['healthy', summary.healthy], ['no_data', summary.noData]] as const).map(([status, count]) => (
              count > 0 && (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-display transition-all',
                    STATUS_CONFIG[status].chip,
                    !activeFilters.has(status) && 'opacity-40'
                  )}
                >
                  {count} {status === 'no_data' ? 'No Data' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            ))}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="ratio-asc">Ratio: Low → High</SelectItem>
              <SelectItem value="ratio-desc">Ratio: High → Low</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pipeline Chart Visualization */}
      {!isSingleLocation && sorted.length > 1 && (
        <PipelineChart locations={sorted} />
      )}

      {/* Location Cards */}
      <div className="space-y-3">
        {visible.map(loc => {
          const config = STATUS_CONFIG[loc.status];
          const ratioPercent = Math.round(loc.ratio * 100);

          return (
            <div
              key={loc.locationId}
              className="bg-muted/30 rounded-lg border border-border/50 p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', config.dot)} />
                  <span className="font-display text-sm tracking-wide">{loc.locationName}</span>
                </div>
                {loc.status !== 'no_data' && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ratio: {ratioPercent}%
                  </span>
                )}
              </div>

              {/* Detail line */}
              <p className="text-xs text-muted-foreground">
                {loc.label} · {loc.forwardCount} next 14d vs {loc.baselineCount} trailing
              </p>

              {/* Progress bar */}
              {loc.status !== 'no_data' && (
                <div className="flex items-center gap-3">
                  <Progress
                    value={Math.min(ratioPercent, 100)}
                    className="h-2 flex-1"
                    indicatorClassName={config.bar}
                  />
                  <span className="text-xs font-display tabular-nums w-10 text-right">{ratioPercent}%</span>
                </div>
              )}

              {/* Boost Bookings CTA for critical/slowing */}
              {(loc.status === 'critical' || loc.status === 'slowing') && (
                <div className="flex justify-end">
                  <Link
                    to={`/dashboard/admin/analytics?tab=marketing`}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    Boost Bookings <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show all toggle */}
      {hasMore && !isSingleLocation && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', showAll && 'rotate-180')} />
          {showAll ? 'Show less' : `Show all ${sorted.length} locations`}
        </button>
      )}
    </div>
  );
}
