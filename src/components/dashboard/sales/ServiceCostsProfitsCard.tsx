import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { AnalyticsFilterBadge, type DateRangeType } from '@/components/dashboard/AnalyticsFilterBadge';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { useServiceCostsProfits, type ServiceCostProfitRow } from '@/hooks/useServiceCostsProfits';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useFormatNumber } from '@/hooks/useFormatNumber';

interface ServiceCostsProfitsCardProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext: any;
  dateRange: string;
  locationName: string;
}

type SortKey = 'locationName' | 'serviceCategory' | 'serviceName' | 'totalServices' | 'totalSales' | 'totalCost' | 'profit' | 'profitPct';

export function ServiceCostsProfitsCard({
  dateFrom, dateTo, locationId, filterContext, dateRange, locationName,
}: ServiceCostsProfitsCardProps) {
  const { data, isLoading } = useServiceCostsProfits(dateFrom, dateTo, locationId);
  const { formatCurrency } = useFormatCurrency();
  const { formatNumber, formatPercent } = useFormatNumber();
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'totalSales', desc: true });

  const toggleSort = (key: SortKey) => {
    setSort(prev => prev.key === key ? { key, desc: !prev.desc } : { key, desc: true });
  };

  const sortedRows = useMemo(() => {
    if (!data?.rows) return [];
    return [...data.rows].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sort.desc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [data, sort]);

  const SortHeader = ({ label, sortKey, className }: { label: string; sortKey: SortKey; className?: string }) => (
    <TableHead
      className={cn('cursor-pointer select-none hover:text-foreground transition-colors', className)}
      onClick={() => toggleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn('w-3 h-3', sort.key === sortKey ? 'text-primary' : 'text-muted-foreground/50')} />
      </div>
    </TableHead>
  );

  const barColors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base tracking-wide">SERVICE COSTS & SALES PROFITS</CardTitle>
              <CardDescription>Analyzing profit margins...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data?.rows.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">SERVICE COSTS & SALES PROFITS</CardTitle>
                  <MetricInfoTooltip description="Shows revenue, cost, and profit margin for each service. Set service costs in Settings → Services." />
                </div>
                <CardDescription>No appointment data for this period</CardDescription>
              </div>
            </div>
            <AnalyticsFilterBadge locationId={locationId} dateRange={dateRange as DateRangeType} />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <PinnableCard elementKey="service_costs_profits" elementName="Service Costs & Sales Profits">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">SERVICE COSTS & SALES PROFITS</CardTitle>
                  <MetricInfoTooltip description="Shows revenue, cost, and profit margin for each service. Set service costs in Settings → Services to see accurate profit data." />
                </div>
                <CardDescription>Profit margins by service</CardDescription>
              </div>
            </div>
            <AnalyticsFilterBadge locationId={locationId} dateRange={dateRange as DateRangeType} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader label="Location" sortKey="locationName" />
                  <SortHeader label="Category" sortKey="serviceCategory" />
                  <SortHeader label="Service" sortKey="serviceName" />
                  <SortHeader label="# Services" sortKey="totalServices" className="text-right" />
                  <SortHeader label="Total Sales" sortKey="totalSales" className="text-right" />
                  <SortHeader label="Cost" sortKey="totalCost" className="text-right" />
                  <SortHeader label="Profit" sortKey="profit" className="text-right" />
                  <SortHeader label="Profit %" sortKey="profitPct" className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row, idx) => {
                  const barWidth = data.maxSales > 0 ? (row.totalSales / data.maxSales) * 100 : 0;
                  const barColor = barColors[idx % barColors.length];
                  return (
                    <TableRow key={`${row.locationId}-${row.serviceCategory}-${row.serviceName}`}>
                      <TableCell className="text-sm">{row.locationName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.serviceCategory}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{row.serviceName}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatNumber(row.totalServices)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', barColor)} style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            <BlurredAmount>{formatCurrency(row.totalSales)}</BlurredAmount>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        <BlurredAmount>{formatCurrency(row.totalCost)}</BlurredAmount>
                      </TableCell>
                      <TableCell className={cn('text-right text-sm font-medium tabular-nums', row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                        <BlurredAmount>{formatCurrency(row.profit)}</BlurredAmount>
                      </TableCell>
                      <TableCell className={cn('text-right text-sm font-medium tabular-nums', row.profitPct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : row.profitPct >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                        {formatPercent(row.profitPct)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Totals row */}
                <TableRow className="bg-muted/30 font-medium border-t-2 border-border">
                  <TableCell colSpan={3} className="text-sm font-display uppercase tracking-wide text-muted-foreground">Totals</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatNumber(data.totals.totalServices)}</TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    <BlurredAmount>{formatCurrency(data.totals.totalSales)}</BlurredAmount>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <BlurredAmount>{formatCurrency(data.totals.totalCost)}</BlurredAmount>
                  </TableCell>
                  <TableCell className={cn('text-right text-sm font-medium tabular-nums', data.totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                    <BlurredAmount>{formatCurrency(data.totals.profit)}</BlurredAmount>
                  </TableCell>
                  <TableCell className={cn('text-right text-sm font-medium tabular-nums', data.totals.profitPct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : data.totals.profitPct >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>
                    {formatPercent(data.totals.profitPct)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PinnableCard>
  );
}
