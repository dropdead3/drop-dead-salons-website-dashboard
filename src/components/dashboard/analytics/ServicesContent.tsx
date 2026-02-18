import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  DollarSign, Scissors, TrendingUp, TrendingDown, Minus, Clock, Hash,
  ArrowUpDown, BarChart3, Loader2, Target, Users, RefreshCw, ChevronDown,
  AlertTriangle, Layers, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useFormatNumber } from '@/hooks/useFormatNumber';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { ServicePopularityChart } from '@/components/dashboard/sales/ServicePopularityChart';
import { useServiceEfficiency, type ServiceEfficiencyRow, type StylistBreakdown } from '@/hooks/useServiceEfficiency';
import { useServiceDemandTrend } from '@/hooks/useServiceDemandTrend';
import { useServiceClientAnalysis } from '@/hooks/useServiceClientAnalysis';
import { useServicePairings } from '@/hooks/useServicePairings';
import { useServiceCategoryColorsMap } from '@/hooks/useServiceCategoryColors';
import { getCategoryColor, isGradientMarker, getGradientFromMarker } from '@/utils/categoryColors';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';

interface ServicesContentProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext: any;
  dateRange: string;
  locationName: string;
}

function resolveHexColor(colorHex: string): string {
  if (!isGradientMarker(colorHex)) return colorHex;
  const grad = getGradientFromMarker(colorHex);
  if (!grad) return '#888888';
  const match = grad.background.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#888888';
}

// Expandable drill-down wrapper
function DrillDown({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="pt-3 pb-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// KPI Tile component — now clickable
function KpiTile({ icon: Icon, label, value, subtitle, isLoading, isExpanded, onClick }: {
  icon: any; label: string; value: string; subtitle?: string; isLoading: boolean;
  isExpanded?: boolean; onClick?: () => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card
      className={cn('transition-colors', onClick && 'cursor-pointer hover:bg-muted/30')}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          {onClick && (
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground ml-auto transition-transform', isExpanded && 'rotate-180')} />
          )}
        </div>
        <div className="text-2xl font-display font-bold tracking-tight">
          <BlurredAmount>{value}</BlurredAmount>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TrendIndicator({ trend }: { trend: 'rising' | 'stable' | 'declining' }) {
  if (trend === 'rising') return <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800 text-xs gap-1"><TrendingUp className="w-3 h-3" />Rising</Badge>;
  if (trend === 'declining') return <Badge variant="outline" className="text-red-500 border-red-200 dark:text-red-400 dark:border-red-800 text-xs gap-1"><TrendingDown className="w-3 h-3" />Declining</Badge>;
  return <Badge variant="outline" className="text-muted-foreground text-xs gap-1"><Minus className="w-3 h-3" />Stable</Badge>;
}

function RebookBar({ rate }: { rate: number }) {
  const color = rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums w-10 text-right',
        rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : rate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'
      )}>{Math.round(rate)}%</span>
    </div>
  );
}

type SortField = 'serviceName' | 'revPerHour' | 'avgRevenue' | 'bookings' | 'avgDuration';

export function ServicesContent({ dateFrom, dateTo, locationId, filterContext, dateRange, locationName }: ServicesContentProps) {
  const { data, isLoading } = useServiceEfficiency(dateFrom, dateTo, locationId);
  const { data: demandTrends, isLoading: trendsLoading } = useServiceDemandTrend(locationId);
  const { data: clientAnalysis, isLoading: clientLoading } = useServiceClientAnalysis(dateFrom, dateTo, locationId);
  const { data: pairings, isLoading: pairingsLoading } = useServicePairings(dateFrom, dateTo, locationId);
  const { formatCurrency, formatCurrencyWhole } = useFormatCurrency();
  const { formatNumber, formatPercent } = useFormatNumber();
  const { colorMap } = useServiceCategoryColorsMap();

  const [efficiencySort, setEfficiencySort] = useState<{ field: SortField; desc: boolean }>({ field: 'revPerHour', desc: true });
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedEfficiency, setExpandedEfficiency] = useState<string | null>(null);
  const [expandedDemand, setExpandedDemand] = useState<string | null>(null);
  const [expandedRebook, setExpandedRebook] = useState<string | null>(null);
  const [clientView, setClientView] = useState<'magnets' | 'retention'>('magnets');

  const toggleKpi = (key: string) => setExpandedKpi(prev => prev === key ? null : key);

  // Category mix data for donut
  const categoryMix = useMemo(() => {
    if (!data?.services) return [];
    const cats = new Map<string, { revenue: number; count: number; services: ServiceEfficiencyRow[] }>();
    for (const s of data.services) {
      const cat = s.category;
      const existing = cats.get(cat) || { revenue: 0, count: 0, services: [] };
      existing.revenue += s.totalRevenue;
      existing.count += s.bookings;
      existing.services.push(s);
      cats.set(cat, existing);
    }
    return [...cats.entries()]
      .map(([category, { revenue, count, services }]) => ({
        category,
        revenue,
        count,
        pct: data.totalServiceRevenue > 0 ? (revenue / data.totalServiceRevenue) * 100 : 0,
        avgTicket: count > 0 ? revenue / count : 0,
        color: resolveHexColor(colorMap[category.toLowerCase()]?.bg || '#888888'),
        services: services.sort((a, b) => b.totalRevenue - a.totalRevenue),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data, colorMap]);

  // Sorted efficiency services
  const sortedServices = useMemo(() => {
    if (!data?.services) return [];
    return [...data.services].sort((a, b) => {
      const aVal = a[efficiencySort.field];
      const bVal = b[efficiencySort.field];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return efficiencySort.desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return efficiencySort.desc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [data, efficiencySort]);

  // Price realization data
  const priceRealizationData = useMemo(() => {
    if (!data?.services) return [];
    return data.services
      .filter(s => s.menuPrice && s.menuPrice > 0 && s.bookings >= 3)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map(s => ({
        name: s.serviceName.length > 20 ? s.serviceName.slice(0, 18) + '…' : s.serviceName,
        fullName: s.serviceName,
        menuPrice: s.menuPrice!,
        avgCollected: s.avgRevenue,
        rate: s.realizationRate!,
      }));
  }, [data]);

  // Client analysis sorted views
  const clientSorted = useMemo(() => {
    if (!clientAnalysis) return [];
    const filtered = clientAnalysis.filter(s => s.totalCount >= 3);
    if (clientView === 'magnets') {
      return [...filtered].sort((a, b) => b.newClientCount - a.newClientCount).slice(0, 10);
    }
    return [...filtered].sort((a, b) => (100 - a.newClientPct) - (100 - b.newClientPct)).slice(0, 10);
  }, [clientAnalysis, clientView]);

  // Rebook data (min 5 bookings)
  const rebookData = useMemo(() => {
    if (!clientAnalysis) return [];
    return clientAnalysis
      .filter(s => s.totalCount >= 5)
      .sort((a, b) => b.rebookRate - a.rebookRate);
  }, [clientAnalysis]);

  // Dormant services for KPI drill-down
  const dormantServices = useMemo(() => {
    if (!data?.services) return [];
    const bookedNames = new Set(data.services.map(s => s.serviceName));
    // We don't have a full catalog list separate from booked, so this will show zero
    return [];
  }, [data]);

  // Top/bottom services for KPI drill-downs
  const top5ByTicket = useMemo(() => data?.services ? [...data.services].filter(s => s.bookings >= 3).sort((a, b) => b.avgRevenue - a.avgRevenue).slice(0, 5) : [], [data]);
  const bottom5ByTicket = useMemo(() => data?.services ? [...data.services].filter(s => s.bookings >= 3).sort((a, b) => a.avgRevenue - b.avgRevenue).slice(0, 5) : [], [data]);
  const top5ByRPH = useMemo(() => data?.services ? [...data.services].filter(s => s.revPerHour > 0 && s.bookings >= 3).sort((a, b) => b.revPerHour - a.revPerHour).slice(0, 5) : [], [data]);
  const bottom5ByRPH = useMemo(() => data?.services ? [...data.services].filter(s => s.revPerHour > 0 && s.bookings >= 3).sort((a, b) => a.revPerHour - b.revPerHour).slice(0, 5) : [], [data]);

  const toggleSort = (field: SortField) => {
    setEfficiencySort(prev =>
      prev.field === field ? { field, desc: !prev.desc } : { field, desc: true }
    );
  };

  // Category rebook/client stats from clientAnalysis
  const getCategoryClientStats = (categoryServices: ServiceEfficiencyRow[]) => {
    if (!clientAnalysis) return { newPct: 0, rebookRate: 0 };
    const names = new Set(categoryServices.map(s => s.serviceName));
    const matching = clientAnalysis.filter(c => names.has(c.serviceName));
    const totalCount = matching.reduce((s, m) => s + m.totalCount, 0);
    const newCount = matching.reduce((s, m) => s + m.newClientCount, 0);
    const rebookedCount = matching.reduce((s, m) => s + m.rebookedCount, 0);
    return {
      newPct: totalCount > 0 ? (newCount / totalCount) * 100 : 0,
      rebookRate: totalCount > 0 ? (rebookedCount / totalCount) * 100 : 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Section 1: KPI Tiles with drill-downs */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiTile
            icon={DollarSign}
            label="Service Revenue"
            value={formatCurrencyWhole(data?.totalServiceRevenue || 0)}
            subtitle="Total for period"
            isLoading={isLoading}
            isExpanded={expandedKpi === 'revenue'}
            onClick={() => toggleKpi('revenue')}
          />
          <KpiTile
            icon={Hash}
            label="Active Services"
            value={formatNumber(data?.activeServiceCount || 0)}
            subtitle="Distinct services booked"
            isLoading={isLoading}
            isExpanded={expandedKpi === 'active'}
            onClick={() => toggleKpi('active')}
          />
          <KpiTile
            icon={Scissors}
            label="Avg Service Ticket"
            value={formatCurrency(data?.avgServiceTicket || 0)}
            subtitle="Revenue per appointment"
            isLoading={isLoading}
            isExpanded={expandedKpi === 'ticket'}
            onClick={() => toggleKpi('ticket')}
          />
          <KpiTile
            icon={Clock}
            label="Rev / Chair Hour"
            value={formatCurrency(data?.overallRevPerHour || 0)}
            subtitle={`${formatNumber(Math.round(data?.totalBookedHours || 0))} hours booked`}
            isLoading={isLoading}
            isExpanded={expandedKpi === 'rph'}
            onClick={() => toggleKpi('rph')}
          />
        </div>

        {/* KPI Drill-down Panels */}
        <DrillDown open={expandedKpi === 'revenue'}>
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Revenue by Category</p>
              <div className="space-y-2">
                {categoryMix.slice(0, 8).map(cat => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm flex-1 truncate">{cat.category}</span>
                    <div className="flex-1 max-w-[200px]">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${cat.pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums w-20 text-right">
                      <BlurredAmount>{formatCurrencyWhole(cat.revenue)}</BlurredAmount>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums w-10">{Math.round(cat.pct)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </DrillDown>

        <DrillDown open={expandedKpi === 'active'}>
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Services booked this period: <strong>{data?.activeServiceCount || 0}</strong></p>
              <p className="text-xs text-muted-foreground">The count of distinct services that had at least one booking. Review your full service menu to identify dormant services that may be candidates for retirement or promotion.</p>
            </CardContent>
          </Card>
        </DrillDown>

        <DrillDown open={expandedKpi === 'ticket'}>
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Top 5 by Avg Ticket</p>
                  <div className="space-y-1.5">
                    {top5ByTicket.map(s => (
                      <div key={s.serviceName} className="flex justify-between text-sm">
                        <span className="truncate max-w-[160px]">{s.serviceName}</span>
                        <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                          <BlurredAmount>{formatCurrency(s.avgRevenue)}</BlurredAmount>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Bottom 5 by Avg Ticket</p>
                  <div className="space-y-1.5">
                    {bottom5ByTicket.map(s => (
                      <div key={s.serviceName} className="flex justify-between text-sm">
                        <span className="truncate max-w-[160px]">{s.serviceName}</span>
                        <span className="font-medium tabular-nums text-red-500">
                          <BlurredAmount>{formatCurrency(s.avgRevenue)}</BlurredAmount>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </DrillDown>

        <DrillDown open={expandedKpi === 'rph'}>
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Top 5 by Rev/Hour</p>
                  <div className="space-y-1.5">
                    {top5ByRPH.map(s => (
                      <div key={s.serviceName} className="flex justify-between text-sm">
                        <span className="truncate max-w-[160px]">{s.serviceName}</span>
                        <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                          <BlurredAmount>{formatCurrency(s.revPerHour)}</BlurredAmount>/hr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Bottom 5 by Rev/Hour</p>
                  <div className="space-y-1.5">
                    {bottom5ByRPH.map(s => (
                      <div key={s.serviceName} className="flex justify-between text-sm">
                        <span className="truncate max-w-[160px]">{s.serviceName}</span>
                        <span className="font-medium tabular-nums text-red-500">
                          <BlurredAmount>{formatCurrency(s.revPerHour)}</BlurredAmount>/hr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Salon average: <strong>{formatCurrency(data?.avgRevPerHour || 0)}</strong>/hr</p>
            </CardContent>
          </Card>
        </DrillDown>
      </div>

      {/* Section 2: Category Mix with drill-down */}
      <PinnableCard elementKey="service_category_mix" elementName="Service Category Mix" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE CATEGORY MIX</CardTitle>
                <CardDescription>Revenue distribution — click a category to drill down</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : categoryMix.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No service data for this period</p>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Donut */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryMix} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
                        {categoryMix.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrencyWhole(value), 'Revenue']} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Table with drill-down */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Avg Ticket</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryMix.map((cat) => {
                        const isExpanded = expandedCategory === cat.category;
                        const clientStats = getCategoryClientStats(cat.services);
                        return (
                          <>
                            <TableRow
                              key={cat.category}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className="font-medium text-sm">{cat.category}</span>
                                  <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                <BlurredAmount>{formatCurrencyWhole(cat.revenue)}</BlurredAmount>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{formatNumber(cat.count)}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{Math.round(cat.pct)}%</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                <BlurredAmount>{formatCurrency(cat.avgTicket)}</BlurredAmount>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow key={`${cat.category}-detail`}>
                                <TableCell colSpan={5} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 bg-muted/20 space-y-3">
                                      {/* Client stats for category */}
                                      <div className="flex gap-4 text-xs">
                                        <span className="flex items-center gap-1">
                                          <Users className="w-3 h-3" /> New clients: <strong>{Math.round(clientStats.newPct)}%</strong>
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <RefreshCw className="w-3 h-3" /> Rebook rate: <strong>{Math.round(clientStats.rebookRate)}%</strong>
                                        </span>
                                      </div>
                                      {/* Services in category */}
                                      <div className="space-y-1">
                                        {cat.services.slice(0, 8).map(svc => (
                                          <div key={svc.serviceName} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                                            <span className="truncate max-w-[180px]">{svc.serviceName}</span>
                                            <div className="flex items-center gap-4">
                                              <span className="tabular-nums">{svc.bookings} bookings</span>
                                              <span className="tabular-nums font-medium">
                                                <BlurredAmount>{formatCurrency(svc.avgRevenue)}</BlurredAmount>
                                              </span>
                                              <span className="tabular-nums text-muted-foreground">
                                                {cat.revenue > 0 ? Math.round((svc.totalRevenue / cat.revenue) * 100) : 0}%
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 3: Client Type Analysis (New) */}
      <PinnableCard elementKey="service_client_analysis" elementName="Client Type by Service" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-base tracking-wide">
                    {clientView === 'magnets' ? 'NEW CLIENT MAGNETS' : 'RETENTION DRIVERS'}
                  </CardTitle>
                  <CardDescription>
                    {clientView === 'magnets'
                      ? 'Which services attract the most new clients?'
                      : 'Which services have the highest returning client percentage?'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  className={cn('px-3 py-1.5 text-xs rounded-md transition-colors', clientView === 'magnets' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80')}
                  onClick={() => setClientView('magnets')}
                >
                  New Clients
                </button>
                <button
                  className={cn('px-3 py-1.5 text-xs rounded-md transition-colors', clientView === 'retention' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80')}
                  onClick={() => setClientView('retention')}
                >
                  Retention
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clientLoading ? (
              <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : clientSorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Not enough data (services need 3+ bookings)</p>
            ) : (
              <div className="space-y-2">
                {clientSorted.map(s => (
                  <div key={s.serviceName} className="flex items-center gap-3">
                    <span className="text-sm truncate w-[180px] shrink-0">{s.serviceName}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500/70 flex items-center justify-center"
                        style={{ width: `${s.newClientPct}%` }}
                      >
                        {s.newClientPct > 15 && <span className="text-[10px] text-white font-medium">{s.newClientCount}</span>}
                      </div>
                      <div
                        className="h-full bg-emerald-500/70 flex items-center justify-center"
                        style={{ width: `${100 - s.newClientPct}%` }}
                      >
                        {(100 - s.newClientPct) > 15 && <span className="text-[10px] text-white font-medium">{s.returningCount}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-12">{s.totalCount}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 px-1">
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500/70" /> New</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /> Returning</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 4: Service Popularity (relocated) */}
      <PinnableCard elementKey="service_popularity_chart" elementName="Service Popularity" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <ServicePopularityChart dateFrom={dateFrom} dateTo={dateTo} filterContext={filterContext} />
      </PinnableCard>

      {/* Section 5: Service Efficiency Matrix with drill-down */}
      <PinnableCard elementKey="service_efficiency_matrix" elementName="Service Efficiency Matrix" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE EFFICIENCY MATRIX</CardTitle>
                <CardDescription>Click any row for stylist breakdown, rebook rate & client mix</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : sortedServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No service data for this period</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('serviceName')}>
                        <span className="flex items-center gap-1">Service <ArrowUpDown className="w-3 h-3" /></span>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('avgDuration')}>
                        <span className="flex items-center justify-end gap-1">Avg Min <ArrowUpDown className="w-3 h-3" /></span>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('avgRevenue')}>
                        <span className="flex items-center justify-end gap-1">Avg Rev <ArrowUpDown className="w-3 h-3" /></span>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('revPerHour')}>
                        <span className="flex items-center justify-end gap-1">Rev/Hr <ArrowUpDown className="w-3 h-3" /></span>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('bookings')}>
                        <span className="flex items-center justify-end gap-1">Bookings <ArrowUpDown className="w-3 h-3" /></span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedServices.slice(0, 20).map((s) => {
                      const avgRPH = data?.avgRevPerHour || 0;
                      const isAbove = s.revPerHour > avgRPH * 1.1;
                      const isBelow = s.revPerHour < avgRPH * 0.9;
                      const isExpanded = expandedEfficiency === s.serviceName;
                      return (
                        <>
                          <TableRow
                            key={s.serviceName}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedEfficiency(isExpanded ? null : s.serviceName)}
                          >
                            <TableCell className="font-medium text-sm max-w-[200px] truncate">
                              <div className="flex items-center gap-1.5">
                                {s.serviceName}
                                {s.concentrationRisk && (
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                                <ChevronDown className={cn('w-3 h-3 text-muted-foreground ml-1 transition-transform shrink-0', isExpanded && 'rotate-180')} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{s.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{s.avgDuration > 0 ? s.avgDuration : '—'}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              <BlurredAmount>{formatCurrency(s.avgRevenue)}</BlurredAmount>
                            </TableCell>
                            <TableCell className={cn(
                              'text-right tabular-nums text-sm font-semibold',
                              isAbove && 'text-emerald-600 dark:text-emerald-400',
                              isBelow && 'text-red-500 dark:text-red-400',
                            )}>
                              <BlurredAmount>{s.revPerHour > 0 ? formatCurrency(s.revPerHour) : '—'}</BlurredAmount>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{formatNumber(s.bookings)}</TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${s.serviceName}-detail`}>
                              <TableCell colSpan={6} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 bg-muted/20 space-y-4">
                                    {/* Quick stats */}
                                    <div className="flex flex-wrap gap-4 text-xs">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> New clients: <strong>{Math.round(s.newClientPct)}%</strong>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3" /> Rebook rate: <strong>{Math.round(s.rebookRate)}%</strong>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" /> Avg tip: <strong>{s.avgTipPct.toFixed(1)}%</strong>
                                      </span>
                                      {s.concentrationRisk && (
                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                          <AlertTriangle className="w-3 h-3" /> Concentration risk — top stylist holds {Math.round(s.stylistBreakdown[0]?.revShare || 0)}% of revenue
                                        </span>
                                      )}
                                    </div>

                                    {/* Stylist breakdown */}
                                    {s.stylistBreakdown.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Stylist Breakdown</p>
                                        <div className="space-y-1">
                                          {s.stylistBreakdown.slice(0, 5).map(st => (
                                            <div key={st.staffId} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                                              <span className="truncate max-w-[140px]">{st.staffName}</span>
                                              <div className="flex items-center gap-4">
                                                <span className="tabular-nums">{st.bookings} bookings</span>
                                                <span className="tabular-nums font-medium">
                                                  <BlurredAmount>{formatCurrency(st.revPerHour)}</BlurredAmount>/hr
                                                </span>
                                                <div className="w-16">
                                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div className={cn('h-full rounded-full', st.revShare > 70 ? 'bg-amber-500' : 'bg-primary/60')} style={{ width: `${st.revShare}%` }} />
                                                  </div>
                                                </div>
                                                <span className="tabular-nums text-muted-foreground w-10 text-right">{Math.round(st.revShare)}%</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
                {data && (
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-4 px-4">
                    <span>Salon avg: <strong>{formatCurrency(data.avgRevPerHour)}</strong>/hr</span>
                    <span className="text-emerald-600 dark:text-emerald-400">■ Above avg</span>
                    <span className="text-red-500 dark:text-red-400">■ Below avg</span>
                    <span className="text-amber-500">▲ Concentration risk</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 6: Service Rebooking Rates (New) */}
      <PinnableCard elementKey="service_rebook_rates" elementName="Service Rebooking Rates" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE REBOOKING RATES</CardTitle>
                <CardDescription>Quality signal — low rebook rate means clients aren't coming back for this service</CardDescription>
              </div>
              <MetricInfoTooltip description="Percentage of appointments where the client rebooked at checkout. Green (>70%) = strong retention. Amber (40-70%) = needs attention. Red (<40%) = investigate." className="ml-auto" />
            </div>
          </CardHeader>
          <CardContent>
            {clientLoading ? (
              <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : rebookData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Not enough data (services need 5+ bookings)</p>
            ) : (
              <div className="space-y-1">
                {rebookData.slice(0, 15).map(s => {
                  const isExpanded = expandedRebook === s.serviceName;
                  return (
                    <div key={s.serviceName}>
                      <div
                        className="flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedRebook(isExpanded ? null : s.serviceName)}
                      >
                        <span className="text-sm truncate w-[200px] shrink-0 flex items-center gap-1.5">
                          {s.serviceName}
                          <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                        </span>
                        <div className="flex-1">
                          <RebookBar rate={s.rebookRate} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-16">{s.totalCount} appts</span>
                      </div>
                      <DrillDown open={isExpanded}>
                        <div className="px-4 pb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Rebook Rate by Stylist</p>
                          <div className="space-y-1">
                            {s.stylistRebook.slice(0, 5).map(st => (
                              <div key={st.staffId} className="flex items-center gap-3 text-xs">
                                <span className="truncate w-[120px]">{st.staffName}</span>
                                <div className="flex-1"><RebookBar rate={st.rate} /></div>
                                <span className="text-muted-foreground tabular-nums w-12">{st.total} appts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DrillDown>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 7: Price Realization */}
      <PinnableCard elementKey="price_realization" elementName="Price Realization" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">PRICE REALIZATION</CardTitle>
                <CardDescription>Menu price vs. actual collected — where is discounting eroding margin?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : priceRealizationData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Not enough data — services need a menu price set and at least 3 bookings</p>
            ) : (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceRealizationData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'menuPrice' ? 'Menu Price' : 'Avg Collected']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="menuPrice" fill="hsl(var(--muted-foreground) / 0.3)" name="Menu Price" radius={[0, 3, 3, 0]} barSize={14} />
                      <Bar dataKey="avgCollected" name="Avg Collected" radius={[0, 3, 3, 0]} barSize={14}>
                        {priceRealizationData.map((entry, i) => (
                          <Cell key={i} fill={entry.rate < 85 ? 'hsl(0 84% 60%)' : entry.rate > 105 ? 'hsl(142 76% 36%)' : 'hsl(var(--primary))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {priceRealizationData.map((s) => (
                    <div key={s.fullName} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-md bg-muted/30">
                      <span className="truncate max-w-[160px]">{s.fullName}</span>
                      <span className={cn('font-semibold tabular-nums', s.rate < 85 && 'text-red-500', s.rate > 105 && 'text-emerald-600 dark:text-emerald-400')}>{Math.round(s.rate)}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-4 px-1">
                  <span className="text-red-500">■ &lt;85% heavy discounting</span>
                  <span className="text-emerald-600 dark:text-emerald-400">■ &gt;105% raise menu price?</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 8: Service Demand Trends with drill-down */}
      <PinnableCard elementKey="service_demand_trends" elementName="Service Demand Trends" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE DEMAND TRENDS</CardTitle>
                <CardDescription>12-week booking trends — click to expand</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : demandTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Not enough historical data for trend analysis</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {demandTrends.map((service) => {
                  const isExpanded = expandedDemand === service.serviceName;
                  // Calculate total bookings across all services for share
                  const totalAllBookings = demandTrends.reduce((s, t) => s + t.totalBookings, 0);
                  const shareOfBookings = totalAllBookings > 0 ? (service.totalBookings / totalAllBookings) * 100 : 0;

                  return (
                    <div
                      key={service.serviceName}
                      className={cn('border border-border/50 rounded-lg p-3 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors', isExpanded && 'col-span-full')}
                      onClick={() => setExpandedDemand(isExpanded ? null : service.serviceName)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium truncate leading-tight">{service.serviceName}</span>
                        <TrendIndicator trend={service.trend} />
                      </div>

                      {!isExpanded ? (
                        <>
                          <div className="h-12">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={service.weeks}>
                                <Line type="monotone" dataKey="count" stroke={service.trend === 'rising' ? 'hsl(142 76% 36%)' : service.trend === 'declining' ? 'hsl(0 84% 60%)' : 'hsl(var(--muted-foreground))'} strokeWidth={1.5} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-muted-foreground tabular-nums">{formatNumber(service.totalBookings)} bookings</p>
                        </>
                      ) : (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Expanded: full chart */}
                          <div className="h-40 mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={service.weeks}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                                <XAxis dataKey="weekStart" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                                <Line type="monotone" dataKey="count" stroke={service.trend === 'rising' ? 'hsl(142 76% 36%)' : service.trend === 'declining' ? 'hsl(0 84% 60%)' : 'hsl(var(--primary))'} strokeWidth={2} dot={{ r: 2 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Week-over-week changes */}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="text-muted-foreground">Total: <strong>{formatNumber(service.totalBookings)}</strong></span>
                            <span className="text-muted-foreground">Share: <strong>{shareOfBookings.toFixed(1)}%</strong> of top services</span>
                            {service.weeks.length >= 2 && (() => {
                              const lastWeek = service.weeks[service.weeks.length - 1]?.count || 0;
                              const prevWeek = service.weeks[service.weeks.length - 2]?.count || 0;
                              const wowChange = prevWeek > 0 ? ((lastWeek - prevWeek) / prevWeek) * 100 : 0;
                              return (
                                <span className={cn(wowChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : wowChange < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                                  WoW: <strong>{wowChange > 0 ? '+' : ''}{wowChange.toFixed(0)}%</strong>
                                </span>
                              );
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 9: Service Pairing Analysis (New) */}
      <PinnableCard elementKey="service_pairings" elementName="Service Pairings" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE PAIRINGS</CardTitle>
                <CardDescription>Most common service combinations — bundle & upsell opportunities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pairingsLoading ? (
              <div className="h-32 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : pairings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No multi-service visits found in this period</p>
            ) : (
              <div className="space-y-2">
                {pairings.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/20">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="truncate max-w-[180px] font-medium">{p.serviceA}</span>
                        <span className="text-muted-foreground shrink-0">+</span>
                        <span className="truncate max-w-[180px] font-medium">{p.serviceB}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs tabular-nums font-medium">{p.count} times</span>
                      <Badge variant="secondary" className="text-xs">{Math.round(p.pctOfVisits)}% of visits</Badge>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-2 px-1">Based on services booked by the same client on the same day. Consider bundling top pairs into packages.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>
    </div>
  );
}
