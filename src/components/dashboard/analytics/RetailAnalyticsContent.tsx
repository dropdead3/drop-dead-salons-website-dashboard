import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  DollarSign, Package, TrendingUp, TrendingDown, AlertTriangle,
  ShoppingBag, Users, Search, ArrowUpDown, BarChart3, Loader2, Info, Percent, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { VisibilityGate } from '@/components/visibility/VisibilityGate';
import { useRetailAnalytics, type ProductRow, type RedFlag } from '@/hooks/useRetailAnalytics';

interface RetailAnalyticsContentProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
}

function ChangeBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">--</span>;
  const positive = value > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
      positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
    )}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{Math.round(value)}{suffix}
    </span>
  );
}

function TrendArrow({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">\u2014</span>;
  const positive = value > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
      positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
    )}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{Math.round(value)}%
    </span>
  );
}

type SortKey = 'revenue' | 'unitsSold' | 'avgPrice' | 'discount' | 'revenueTrend';
type SortDir = 'asc' | 'desc';
type StaffSortKey = 'name' | 'productRevenue' | 'unitsSold' | 'attachmentRate' | 'avgTicket';

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const BAR_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))',
];

function RedFlagRow({ flag }: { flag: RedFlag }) {
  const isDanger = flag.severity === 'danger';
  const typeConfig: Record<string, { icon: typeof TrendingDown; color: string }> = {
    declining: { icon: TrendingDown, color: 'text-red-500' },
    heavy_discount: { icon: Tag, color: 'text-amber-500' },
    slow_mover: { icon: Package, color: 'text-orange-500' },
  };
  const cfg = typeConfig[flag.type];
  const Icon = cfg.icon;
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border px-3 py-2.5',
      isDanger
        ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
        : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20',
    )}>
      <Icon className={cn('w-4 h-4 shrink-0', cfg.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{flag.product}</p>
        <p className="text-xs text-muted-foreground">{flag.detail}</p>
      </div>
      <Badge variant="outline" className={cn(
        'text-[10px] shrink-0',
        isDanger
          ? 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-800'
          : 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-800',
      )}>
        {flag.label}
      </Badge>
    </div>
  );
}

export function RetailAnalyticsContent({ dateFrom, dateTo, locationId }: RetailAnalyticsContentProps) {
  const { data, isLoading } = useRetailAnalytics(dateFrom, dateTo, locationId);
  const { formatCurrencyWhole } = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffSortKey, setStaffSortKey] = useState<StaffSortKey>('productRevenue');
  const [staffSortDir, setStaffSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleStaffSort = (key: StaffSortKey) => {
    if (staffSortKey === key) setStaffSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setStaffSortKey(key); setStaffSortDir('desc'); }
  };

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let list = data.products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
    }
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
  }, [data, search, sortKey, sortDir]);

  const filteredStaff = useMemo(() => {
    if (!data) return [];
    let list = data.staffRetail;
    if (staffSearch) {
      const q = staffSearch.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    const dir = staffSortDir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      if (staffSortKey === 'name') return a.name.localeCompare(b.name) * dir;
      return (a[staffSortKey] - b[staffSortKey]) * dir;
    });
  }, [data, staffSearch, staffSortKey, staffSortDir]);

  const summary = data?.summary;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-8 w-28" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6 flex items-center justify-center h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
      </div>
    );
  }

  if (!data || !summary) return null;

  const kpis = [
    { label: 'Product Revenue', value: formatCurrencyWhole(summary.totalRevenue), change: summary.revenueChange as number | null, icon: DollarSign, tooltip: 'Total revenue from retail product sales in the selected period. Change is compared against the equivalent prior period.' },
    { label: 'Units Sold', value: summary.totalUnits.toLocaleString(), change: summary.unitsChange as number | null, icon: Package, tooltip: 'Total quantity of retail products sold. Change is compared against the equivalent prior period.' },
    { label: 'Attachment Rate', value: `${summary.attachmentRate}%`, change: null as number | null, icon: ShoppingBag, tooltip: 'Percentage of service transactions that also included a retail product sale. Higher rates indicate effective retail recommendations.' },
    { label: 'Avg Product Ticket', value: formatCurrencyWhole(summary.avgProductTicket), change: null as number | null, icon: Tag, tooltip: 'Average revenue per retail unit sold. Calculated as total product revenue divided by total units sold.' },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-muted flex items-center justify-center rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                    <MetricInfoTooltip description={kpi.tooltip} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-display tabular-nums"><BlurredAmount>{kpi.value}</BlurredAmount></span>
                  {kpi.change !== null && <ChangeBadge value={kpi.change} />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section 2: Product Performance Table */}
      <PinnableCard elementKey="retail_product_performance" elementName="Product Performance" category="Analytics Hub - Retail">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">PRODUCT PERFORMANCE</CardTitle>
                  <MetricInfoTooltip description="All retail products sold in the selected period, ranked by revenue. Trend compares each product's revenue to the equivalent prior period. Best Sellers are the top 3 by revenue." />
                </div>
                <CardDescription className="text-xs">{summary.uniqueProducts} products sold</CardDescription>
              </div>
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('unitsSold')}>
                      <span className="inline-flex items-center gap-1">Units <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('revenue')}>
                      <span className="inline-flex items-center gap-1">Revenue <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('avgPrice')}>
                      <span className="inline-flex items-center gap-1">Avg Price <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('discount')}>
                      <span className="inline-flex items-center gap-1">Discount <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('revenueTrend')}>
                      <span className="inline-flex items-center gap-1">Trend <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {search ? 'No products match your search' : 'No product sales in this period'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((p, idx) => {
                      const realRank = data.products.findIndex(pp => pp.name === p.name);
                      const isBestSeller = realRank >= 0 && realRank < 3;
                      return (
                        <TableRow key={p.name} className={cn(isBestSeller && 'bg-chart-2/[0.03]')}>
                          <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{p.name}</span>
                              {isBestSeller && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-chart-2 border-chart-2/30">Best Seller</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{p.category || '\u2014'}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.unitsSold}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium"><BlurredAmount>{formatCurrencyWhole(p.revenue)}</BlurredAmount></TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground"><BlurredAmount>{formatCurrencyWhole(p.avgPrice)}</BlurredAmount></TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {p.discount > 0 ? <BlurredAmount>{formatCurrencyWhole(p.discount)}</BlurredAmount> : '\u2014'}
                          </TableCell>
                          <TableCell className="text-right"><TrendArrow value={p.revenueTrend} /></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                {filteredProducts.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell />
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-display tabular-nums">{summary.totalUnits}</TableCell>
                      <TableCell className="text-right font-display tabular-nums"><BlurredAmount>{formatCurrencyWhole(summary.totalRevenue)}</BlurredAmount></TableCell>
                      <TableCell />
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {summary.totalDiscount > 0 ? <BlurredAmount>{formatCurrencyWhole(summary.totalDiscount)}</BlurredAmount> : '\u2014'}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 3: Red Flags */}
      {data.redFlags.length > 0 && (
        <PinnableCard elementKey="retail_red_flags" elementName="Retail Red Flags" category="Analytics Hub - Retail">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">RED FLAGS & ALERTS</CardTitle>
                  <MetricInfoTooltip description="Products needing attention: declining sales (revenue down >20% vs prior period), heavy discounting (>15% of retail value discounted), or slow movers (<3 units sold in the period)." />
                </div>
                <Badge variant="destructive" className="ml-auto text-xs">{data.redFlags.length} alert{data.redFlags.length !== 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.redFlags.map((flag, idx) => (
                  <RedFlagRow key={`${flag.product}-${flag.type}-${idx}`} flag={flag} />
                ))}
              </div>
            </CardContent>
          </Card>
        </PinnableCard>
      )}

      {/* Section 4: Category Breakdown */}
      <PinnableCard elementKey="retail_category_breakdown" elementName="Category Breakdown" category="Analytics Hub - Retail">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-base tracking-wide">CATEGORY BREAKDOWN</CardTitle>
                <MetricInfoTooltip description="Revenue distribution across product categories. Percentage shows each category's share of total retail revenue." />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.categories.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No category data available</p>
            ) : (
              <div className="space-y-6">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categories.slice(0, 10)} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value: number) => [formatCurrencyWhole(value), 'Revenue']} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {data.categories.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead className="text-right">Avg Price</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.categories.map((cat) => (
                        <TableRow key={cat.category}>
                          <TableCell className="font-medium">{cat.category}</TableCell>
                          <TableCell className="text-right tabular-nums"><BlurredAmount>{formatCurrencyWhole(cat.revenue)}</BlurredAmount></TableCell>
                          <TableCell className="text-right tabular-nums">{cat.units}</TableCell>
                          <TableCell className="text-right tabular-nums">{cat.productCount}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground"><BlurredAmount>{formatCurrencyWhole(cat.avgPrice)}</BlurredAmount></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={cat.pctOfTotal} className="w-16 h-1.5" />
                              <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{Math.round(cat.pctOfTotal)}%</span>
                            </div>
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

      {/* Section 5: Product Trend Chart */}
      <PinnableCard elementKey="retail_product_trend" elementName="Product Revenue Trend" category="Analytics Hub - Retail">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-base tracking-wide">PRODUCT REVENUE TREND</CardTitle>
                <MetricInfoTooltip description="Daily retail product revenue over the selected date range. Use this to spot seasonal patterns, promotional impacts, or consistent growth/decline." />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.dailyTrend.length < 2 ? (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a wider date range to view trend data</p>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrend} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="retailGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tickFormatter={(d) => { const parts = d.split('-'); return `${parseInt(parts[1])}/${parseInt(parts[2])}`; }} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => [formatCurrencyWhole(value), 'Product Revenue']} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#retailGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 6: Staff Retail Performance */}
      <PinnableCard elementKey="retail_staff_performance" elementName="Staff Retail Performance" category="Analytics Hub - Retail">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">STAFF RETAIL PERFORMANCE</CardTitle>
                  <MetricInfoTooltip description="Per-stylist retail sales metrics. Attachment rate is the percentage of each stylist's service transactions that included a product sale. Avg ticket is average revenue per unit sold." />
                </div>
                <CardDescription className="text-xs">Retail sales by team member</CardDescription>
              </div>
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search staff..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleStaffSort('name')}>
                      <span className="inline-flex items-center gap-1">Stylist <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleStaffSort('productRevenue')}>
                      <span className="inline-flex items-center gap-1">Product Revenue <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleStaffSort('unitsSold')}>
                      <span className="inline-flex items-center gap-1">Units Sold <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleStaffSort('attachmentRate')}>
                      <span className="inline-flex items-center gap-1">Attachment Rate <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleStaffSort('avgTicket')}>
                      <span className="inline-flex items-center gap-1">Avg Ticket <ArrowUpDown className="w-3 h-3" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {staffSearch ? 'No staff match your search' : 'No staff retail data in this period'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((s, idx) => {
                      const isTop = idx === 0 && staffSortKey === 'productRevenue' && staffSortDir === 'desc';
                      return (
                        <TableRow key={s.userId || s.name} className={cn(isTop && 'bg-chart-2/[0.03]')}>
                          <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-7 h-7">
                                {s.photoUrl && <AvatarImage src={s.photoUrl} alt={s.name} />}
                                <AvatarFallback className="text-[10px]">{getInitials(s.name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{s.name}</span>
                              {isTop && <span className="text-[9px] text-chart-2 font-medium uppercase tracking-wider">Top</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium"><BlurredAmount>{formatCurrencyWhole(s.productRevenue)}</BlurredAmount></TableCell>
                          <TableCell className="text-right tabular-nums">{s.unitsSold}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.attachmentRate}%</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground"><BlurredAmount>{formatCurrencyWhole(s.avgTicket)}</BlurredAmount></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                {filteredStaff.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell />
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-display tabular-nums"><BlurredAmount>{formatCurrencyWhole(summary.totalRevenue)}</BlurredAmount></TableCell>
                      <TableCell className="text-right font-display tabular-nums">{summary.totalUnits}</TableCell>
                      <TableCell className="text-right tabular-nums">{summary.attachmentRate}%</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      </PinnableCard>

      {/* Section 7: Margin Analysis (conditional) */}
      {data.marginData ? (
        <PinnableCard elementKey="retail_margin_analysis" elementName="Margin Analysis" category="Analytics Hub - Retail">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                  <Percent className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">MARGIN ANALYSIS</CardTitle>
                  <MetricInfoTooltip description="Profit margin analysis using cost data from the product catalog. Gross margin = (revenue - cost) / revenue. Only products with cost data configured are included." />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Gross Margin</p>
                  <p className="text-2xl font-display tabular-nums">{data.marginData.grossMarginPct.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Estimated Profit</p>
                  <p className="text-2xl font-display tabular-nums"><BlurredAmount>{formatCurrencyWhole(data.marginData.estimatedProfit)}</BlurredAmount></p>
                </div>
                {data.marginData.products.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Highest Margin</p>
                    <p className="text-sm font-medium">{data.marginData.products[0]?.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{data.marginData.products[0]?.margin.toFixed(1)}% margin</p>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.marginData.products.map((m) => (
                      <TableRow key={m.name}>
                        <TableCell className="font-medium text-sm">{m.name}</TableCell>
                        <TableCell className="text-right tabular-nums"><BlurredAmount>{formatCurrencyWhole(m.revenue)}</BlurredAmount></TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground"><BlurredAmount>{formatCurrencyWhole(m.cost)}</BlurredAmount></TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn(
                            'text-xs tabular-nums',
                            m.margin >= 50 ? 'text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' :
                            m.margin >= 30 ? 'text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' :
                            'text-red-500 border-red-200 dark:text-red-400 dark:border-red-800'
                          )}>
                            {m.margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium"><BlurredAmount>{formatCurrencyWhole(m.profit)}</BlurredAmount></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </PinnableCard>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Info className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Margin Analysis Unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">Add cost prices to your product catalog to unlock profit margin insights.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
