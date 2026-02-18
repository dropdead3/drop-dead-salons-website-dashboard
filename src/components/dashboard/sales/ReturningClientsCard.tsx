import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck, TrendingUp, TrendingDown, ChevronRight, Minus } from 'lucide-react';
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
import { Link } from 'react-router-dom';

interface ReturningClientsCardProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext?: FilterContext;
}

export function ReturningClientsCard({ dateFrom, dateTo, locationId, filterContext }: ReturningClientsCardProps) {
  const { data, isLoading } = useClientVisitsByStaff(dateFrom, dateTo, locationId);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  if (isLoading) {
    return (
      <Card className={tokens.card.wrapper}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={tokens.card.iconBox}>
                <UserCheck className={tokens.card.icon} />
              </div>
              <div>
                <CardTitle className={tokens.card.title}>RETURNING CLIENTS</CardTitle>
                <CardDescription>Returning client percentage by stylist</CardDescription>
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
      <Card className={tokens.card.wrapper}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={tokens.card.iconBox}>
                <UserCheck className={tokens.card.icon} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className={tokens.card.title}>RETURNING CLIENTS</CardTitle>
                  <MetricInfoTooltip description="Percentage of appointments from returning clients versus new clients across the team." />
                </div>
                <CardDescription>Returning client percentage by stylist</CardDescription>
              </div>
            </div>
            {filterContext && (
              <AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={UserCheck}
            title="No data available"
            description="No appointment data found for the selected period."
          />
        </CardContent>
      </Card>
    );
  }

  const { overallReturningRate, returningPercentChange, staffBreakdown } = data;

  const chartData = staffBreakdown
    .filter(s => s.totalVisits > 0)
    .map(s => ({
      name: s.staffName.length > 12 ? s.staffName.slice(0, 11) + '…' : s.staffName,
      fullName: s.staffName,
      rate: Math.round((s.returningClientVisits / s.totalVisits) * 100),
      staffId: s.staffId,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  const chartHeight = Math.max(200, chartData.length * 36 + 20);

  const handleBarClick = (staffId: string) => {
    setExpandedStaff(prev => (prev === staffId ? null : staffId));
    if (!hasInteracted) setHasInteracted(true);
  };

  const expandedDetail = expandedStaff
    ? staffBreakdown.find(s => s.staffId === expandedStaff)
    : null;

  return (
    <Card className={tokens.card.wrapper}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={tokens.card.iconBox}>
              <UserCheck className={tokens.card.icon} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={tokens.card.title}>RETURNING CLIENTS</CardTitle>
                <MetricInfoTooltip description="Percentage of appointments from returning clients. Higher retention indicates stronger client relationships and predictable revenue." />
              </div>
              <CardDescription>Returning client percentage by stylist</CardDescription>
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
            <span className={tokens.stat.xlarge}>{Math.round(overallReturningRate)}%</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Returning</span>
            {returningPercentChange !== null && (
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs font-medium',
                returningPercentChange > 0 ? 'text-green-500' : returningPercentChange < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {returningPercentChange > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : returningPercentChange < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>{Math.abs(returningPercentChange).toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal">vs prior</span>
              </div>
            )}
          </div>

          {/* Right Panel — Bar Chart */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={tokens.heading.subsection}>% Returning by Stylist</h3>
            </div>

            <svg width="0" height="0">
              <defs>
                <linearGradient id="returningBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                </linearGradient>
                <linearGradient id="returningBarGradientActive" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                </linearGradient>
              </defs>
            </svg>

            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Bar
                  dataKey="rate"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  stroke="hsl(var(--primary) / 0.3)"
                  strokeWidth={1}
                  onClick={(_: any, index: number) => {
                    const item = chartData[index];
                    if (item) handleBarClick(item.staffId);
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.staffId}
                      fill={expandedStaff === entry.staffId ? 'url(#returningBarGradientActive)' : 'url(#returningBarGradient)'}
                    />
                  ))}
                  <LabelList
                    dataKey="rate"
                    position="right"
                    formatter={(value: number) => `${value}%`}
                    style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <AnimatePresence>
              {!hasInteracted && (
                <motion.p
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(tokens.body.muted, 'text-xs text-center mt-1 opacity-60')}
                >
                  Click a bar to explore
                </motion.p>
              )}
            </AnimatePresence>

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
                        <Link
                          to={`/dashboard/admin/team/${expandedDetail.userId}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View Profile <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className={tokens.body.muted}>Total Appointments</p>
                        <p className={tokens.body.emphasis}>{expandedDetail.totalVisits}</p>
                      </div>
                      <div>
                        <p className={tokens.body.muted}>New Clients</p>
                        <p className={tokens.body.emphasis}>{expandedDetail.newClientVisits}</p>
                      </div>
                      <div>
                        <p className={tokens.body.muted}>Returning</p>
                        <p className={tokens.body.emphasis}>{expandedDetail.returningClientVisits}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={tokens.body.muted}>Average Ticket</p>
                        <p className={tokens.body.emphasis}>
                          <AnimatedBlurredAmount value={expandedDetail.avgTicket} currency="USD" />
                        </p>
                      </div>
                      <div>
                        <p className={tokens.body.muted}>Returning Rate</p>
                        <p className={tokens.body.emphasis}>
                          {expandedDetail.totalVisits > 0
                            ? Math.round((expandedDetail.returningClientVisits / expandedDetail.totalVisits) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
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
