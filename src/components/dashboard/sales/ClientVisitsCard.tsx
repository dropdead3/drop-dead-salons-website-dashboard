import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, ChevronRight, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@/lib/design-tokens';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useClientVisitsByStaff } from '@/hooks/useClientVisitsByStaff';
import { cn } from '@/lib/utils';

interface ClientVisitsCardProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

export function ClientVisitsCard({ dateFrom, dateTo, locationId, filterContext }: ClientVisitsCardProps) {
  const { data, isLoading } = useClientVisitsByStaff(dateFrom, dateTo, locationId);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={tokens.card.iconBox}>
                <Users className={tokens.card.icon} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className={tokens.card.title}>CLIENT VISITS</CardTitle>
                </div>
                <CardDescription>Visit volume by team member</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[200px_1fr] gap-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.staffBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={tokens.card.iconBox}>
                <Users className={tokens.card.icon} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className={tokens.card.title}>CLIENT VISITS</CardTitle>
                  <MetricInfoTooltip description="Total completed client visits across the team for the selected period. Excludes cancelled and no-show appointments." />
                </div>
                <CardDescription>Visit volume by team member</CardDescription>
              </div>
            </div>
            {filterContext && (
              <AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title="No visits found"
            description="No completed appointments found for the selected period."
          />
        </CardContent>
      </Card>
    );
  }

  const { totalVisits, percentChange, staffBreakdown } = data;
  const chartData = staffBreakdown.slice(0, 10).map(s => ({
    name: s.staffName.length > 12 ? s.staffName.slice(0, 11) + '…' : s.staffName,
    fullName: s.staffName,
    visits: s.totalVisits,
    staffId: s.staffId,
  }));

  const chartHeight = Math.max(200, chartData.length * 36 + 20);

  const handleBarClick = (staffId: string) => {
    setExpandedStaff(prev => (prev === staffId ? null : staffId));
  };

  const expandedDetail = expandedStaff
    ? staffBreakdown.find(s => s.staffId === expandedStaff)
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={tokens.card.iconBox}>
              <Users className={tokens.card.icon} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={tokens.card.title}>CLIENT VISITS</CardTitle>
                <MetricInfoTooltip description="Total completed client visits across the team for the selected period. Excludes cancelled and no-show appointments. Compares against the equivalent prior period." />
              </div>
              <CardDescription>Visit volume by team member</CardDescription>
            </div>
          </div>
          {filterContext && (
            <AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Left Panel — Hero KPI */}
          <div className="flex flex-col items-center md:items-start justify-center gap-1 border-b md:border-b-0 md:border-r border-border/40 pb-4 md:pb-0 md:pr-6">
            <span className={tokens.stat.xlarge}>{totalVisits.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Visits</span>
            {percentChange !== null && (
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs font-medium',
                percentChange > 0 ? 'text-green-500' : percentChange < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {percentChange > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : percentChange < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>{Math.abs(percentChange).toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal">vs prior</span>
              </div>
            )}
          </div>

          {/* Right Panel — Bar Chart */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={tokens.heading.subsection}>Visits by Stylist</h3>
            </div>

            <svg width="0" height="0">
              <defs>
                <linearGradient id="clientVisitsBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                </linearGradient>
              </defs>
            </svg>

            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Bar
                  dataKey="visits"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  fill="url(#clientVisitsBarGradient)"
                  stroke="hsl(var(--primary) / 0.3)"
                  strokeWidth={1}
                  onClick={(_: any, index: number) => {
                    const item = chartData[index];
                    if (item) handleBarClick(item.staffId);
                  }}
                >
                  <LabelList
                    dataKey="visits"
                    position="right"
                    style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Drill-down Panel */}
            <AnimatePresence>
              {expandedDetail && (
                <motion.div
                  key={expandedDetail.staffId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-xl border border-border/50 bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(tokens.heading.subsection, 'text-foreground')}>
                        {expandedDetail.staffName}
                      </h4>
                      {expandedDetail.userId && (
                        <a
                          href={`/dashboard/admin/team/${expandedDetail.userId}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View Profile <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">New Clients</p>
                        <p className="text-sm font-medium">{expandedDetail.newClientVisits}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Returning</p>
                        <p className="text-sm font-medium">{expandedDetail.returningClientVisits}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Average Ticket</p>
                        <p className="text-sm font-medium">
                          <AnimatedBlurredAmount value={expandedDetail.avgTicket} currency="USD" />
                        </p>
                      </div>
                    </div>

                    {expandedDetail.topServices.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Top Services</p>
                        <div className="space-y-1">
                          {expandedDetail.topServices.map(svc => (
                            <div key={svc.name} className="flex items-center justify-between text-xs">
                              <span className="text-foreground truncate max-w-[200px]">{svc.name}</span>
                              <span className="text-muted-foreground">{svc.count} visits</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
