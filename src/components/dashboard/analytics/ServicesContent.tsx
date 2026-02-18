import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  DollarSign, Scissors, TrendingUp, TrendingDown, Minus, Clock, Hash,
  ArrowUpDown, BarChart3, Loader2, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useFormatNumber } from '@/hooks/useFormatNumber';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { ServicePopularityChart } from '@/components/dashboard/sales/ServicePopularityChart';
import { useServiceEfficiency, type ServiceEfficiencyRow } from '@/hooks/useServiceEfficiency';
import { useServiceDemandTrend } from '@/hooks/useServiceDemandTrend';
import { useServiceCategoryColorsMap } from '@/hooks/useServiceCategoryColors';
import { getCategoryColor, isGradientMarker, getGradientFromMarker } from '@/utils/categoryColors';
import { getServiceCategory } from '@/utils/serviceCategorization';

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

// KPI Tile component
function KpiTile({ icon: Icon, label, value, subtitle, isLoading }: {
  icon: any; label: string; value: string; subtitle?: string; isLoading: boolean;
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
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
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

type SortField = 'serviceName' | 'revPerHour' | 'avgRevenue' | 'bookings' | 'avgDuration';

export function ServicesContent({ dateFrom, dateTo, locationId, filterContext, dateRange, locationName }: ServicesContentProps) {
  const { data, isLoading } = useServiceEfficiency(dateFrom, dateTo, locationId);
  const { data: demandTrends, isLoading: trendsLoading } = useServiceDemandTrend(locationId);
  const { formatCurrency, formatCurrencyWhole } = useFormatCurrency();
  const { formatNumber, formatPercent } = useFormatNumber();
  const { colorMap } = useServiceCategoryColorsMap();

  const [efficiencySort, setEfficiencySort] = useState<{ field: SortField; desc: boolean }>({ field: 'revPerHour', desc: true });

  // Category mix data for donut
  const categoryMix = useMemo(() => {
    if (!data?.services) return [];
    const cats = new Map<string, { revenue: number; count: number }>();
    for (const s of data.services) {
      const cat = s.category;
      const existing = cats.get(cat) || { revenue: 0, count: 0 };
      existing.revenue += s.totalRevenue;
      existing.count += s.bookings;
      cats.set(cat, existing);
    }
    return [...cats.entries()]
      .map(([category, { revenue, count }]) => ({
        category,
        revenue,
        count,
        pct: data.totalServiceRevenue > 0 ? (revenue / data.totalServiceRevenue) * 100 : 0,
        avgTicket: count > 0 ? revenue / count : 0,
        color: resolveHexColor(colorMap[category.toLowerCase()]?.bg || '#888888'),
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

  const toggleSort = (field: SortField) => {
    setEfficiencySort(prev =>
      prev.field === field ? { field, desc: !prev.desc } : { field, desc: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Section 1: KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile
          icon={DollarSign}
          label="Service Revenue"
          value={formatCurrencyWhole(data?.totalServiceRevenue || 0)}
          subtitle="Total for period"
          isLoading={isLoading}
        />
        <KpiTile
          icon={Hash}
          label="Active Services"
          value={formatNumber(data?.activeServiceCount || 0)}
          subtitle="Distinct services booked"
          isLoading={isLoading}
        />
        <KpiTile
          icon={Scissors}
          label="Avg Service Ticket"
          value={formatCurrency(data?.avgServiceTicket || 0)}
          subtitle="Revenue per appointment"
          isLoading={isLoading}
        />
        <KpiTile
          icon={Clock}
          label="Rev / Chair Hour"
          value={formatCurrency(data?.overallRevPerHour || 0)}
          subtitle={`${formatNumber(Math.round(data?.totalBookedHours || 0))} hours booked`}
          isLoading={isLoading}
        />
      </div>

      {/* Section 2: Category Mix */}
      <PinnableCard elementKey="service_category_mix" elementName="Service Category Mix" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE CATEGORY MIX</CardTitle>
                <CardDescription>Revenue distribution across service categories</CardDescription>
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
                      <Pie
                        data={categoryMix}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {categoryMix.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrencyWhole(value), 'Revenue']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Table */}
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
                      {categoryMix.map((cat) => (
                        <TableRow key={cat.category}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="font-medium text-sm">{cat.category}</span>
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 3: Service Popularity (relocated) */}
      <PinnableCard elementKey="service_popularity_chart" elementName="Service Popularity" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <ServicePopularityChart dateFrom={dateFrom} dateTo={dateTo} filterContext={filterContext} />
      </PinnableCard>

      {/* Section 4: Service Efficiency Matrix */}
      <PinnableCard elementKey="service_efficiency_matrix" elementName="Service Efficiency Matrix" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE EFFICIENCY MATRIX</CardTitle>
                <CardDescription>Services ranked by revenue per chair hour — the best use of time</CardDescription>
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
                      return (
                        <TableRow key={s.serviceName}>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">{s.serviceName}</TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
                {data && (
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-4 px-4">
                    <span>Salon avg: <strong>{formatCurrency(data.avgRevPerHour)}</strong>/hr</span>
                    <span className="text-emerald-600 dark:text-emerald-400">■ Above avg</span>
                    <span className="text-red-500 dark:text-red-400">■ Below avg</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 5: Price Realization */}
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
              <p className="text-sm text-muted-foreground text-center py-8">
                Not enough data — services need a menu price set and at least 3 bookings
              </p>
            ) : (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceRealizationData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'menuPrice' ? 'Menu Price' : 'Avg Collected',
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="menuPrice" fill="hsl(var(--muted-foreground) / 0.3)" name="Menu Price" radius={[0, 3, 3, 0]} barSize={14} />
                      <Bar dataKey="avgCollected" name="Avg Collected" radius={[0, 3, 3, 0]} barSize={14}>
                        {priceRealizationData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.rate < 85
                                ? 'hsl(0 84% 60%)' // red - heavy discounting
                                : entry.rate > 105
                                  ? 'hsl(142 76% 36%)' // green - opportunity
                                  : 'hsl(var(--primary))'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {priceRealizationData.map((s) => (
                    <div key={s.fullName} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-md bg-muted/30">
                      <span className="truncate max-w-[160px]">{s.fullName}</span>
                      <span className={cn(
                        'font-semibold tabular-nums',
                        s.rate < 85 && 'text-red-500',
                        s.rate > 105 && 'text-emerald-600 dark:text-emerald-400',
                      )}>
                        {Math.round(s.rate)}%
                      </span>
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

      {/* Section 6: Service Demand Trends */}
      <PinnableCard elementKey="service_demand_trends" elementName="Service Demand Trends" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base tracking-wide">SERVICE DEMAND TRENDS</CardTitle>
                <CardDescription>12-week booking trends for top services</CardDescription>
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
                {demandTrends.map((service) => (
                  <div key={service.serviceName} className="border border-border/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium truncate leading-tight">{service.serviceName}</span>
                      <TrendIndicator trend={service.trend} />
                    </div>
                    <div className="h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={service.weeks}>
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke={
                              service.trend === 'rising'
                                ? 'hsl(142 76% 36%)'
                                : service.trend === 'declining'
                                  ? 'hsl(0 84% 60%)'
                                  : 'hsl(var(--muted-foreground))'
                            }
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatNumber(service.totalBookings)} bookings</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>
    </div>
  );
}
