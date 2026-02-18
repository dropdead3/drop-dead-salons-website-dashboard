import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Layers, TrendingUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServicePairings } from '@/hooks/useServicePairings';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { AnalyticsFilterBadge } from '@/components/dashboard/AnalyticsFilterBadge';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { PinnableCard } from '@/components/dashboard/PinnableCard';

interface ServiceBundlingIntelligenceProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  filterContext: any;
  dateRange: string;
  locationName: string;
}

export function ServiceBundlingIntelligence({
  dateFrom, dateTo, locationId, filterContext, dateRange, locationName,
}: ServiceBundlingIntelligenceProps) {
  const { standaloneRates, revenueLift, categoryPairings, isLoading } = useServicePairings(dateFrom, dateTo, locationId);
  const { formatCurrency } = useFormatCurrency();

  if (isLoading) {
    return (
      <PinnableCard elementKey="service_pairings" elementName="Service Bundling Intelligence" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </PinnableCard>
    );
  }

  const noData = standaloneRates.length === 0 && revenueLift.length === 0 && categoryPairings.length === 0;

  // Build unique categories for heatmap
  const heatmapCats = Array.from(new Set(categoryPairings.flatMap(p => [p.categoryA, p.categoryB]))).sort();
  const pairMap = new Map<string, { count: number; pct: number }>();
  for (const p of categoryPairings) {
    pairMap.set(`${p.categoryA}|||${p.categoryB}`, { count: p.count, pct: p.pctOfMultiVisits });
    pairMap.set(`${p.categoryB}|||${p.categoryA}`, { count: p.count, pct: p.pctOfMultiVisits });
  }
  const maxCount = categoryPairings.length > 0 ? Math.max(...categoryPairings.map(p => p.count)) : 1;

  return (
    <PinnableCard elementKey="service_pairings" elementName="Service Bundling Intelligence" category="Analytics Hub - Sales" dateRange={dateRange} locationName={locationName}>
      <div className="space-y-4">
        {/* Card 1: Standalone vs Grouped */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-display text-base tracking-wide">STANDALONE VS. GROUPED</CardTitle>
                    <MetricInfoTooltip description="Shows what percentage of visits containing each service category were single-service (standalone) vs. multi-service (grouped). High standalone rates signal upsell opportunities." />
                  </div>
                  <CardDescription>How often each category is booked alone vs. with other services</CardDescription>
                </div>
              </div>
              <AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />
            </div>
          </CardHeader>
          <CardContent>
            {standaloneRates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Not enough data for this period</p>
            ) : (
              <div className="space-y-3">
                {standaloneRates.map(r => (
                  <div key={r.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{r.totalBookings} visits</Badge>
                      </div>
                    </div>
                    <div className="flex h-5 rounded-md overflow-hidden bg-muted/30">
                      <div
                        className="bg-amber-500/80 flex items-center justify-center text-[10px] font-semibold text-amber-950 transition-all"
                        style={{ width: `${Math.max(r.standaloneRate, 4)}%` }}
                      >
                        {r.standaloneRate >= 15 ? `${Math.round(r.standaloneRate)}% solo` : ''}
                      </div>
                      <div
                        className="bg-emerald-500/80 flex items-center justify-center text-[10px] font-semibold text-emerald-950 transition-all"
                        style={{ width: `${Math.max(r.groupedRate, 4)}%` }}
                      >
                        {r.groupedRate >= 15 ? `${Math.round(r.groupedRate)}% grouped` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-3 px-1">
                  Categories with high standalone rates represent your biggest upsell opportunities — consider creating bundles.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Revenue Lift */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">REVENUE LIFT FROM GROUPING</CardTitle>
                  <MetricInfoTooltip description="Compares the average visit ticket when a category is booked alone vs. as part of a multi-service visit. Lift quantifies the dollar impact of bundling." />
                </div>
                <CardDescription>Average ticket difference between solo and grouped visits</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueLift.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Not enough data — need categories with both solo and grouped visits</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Avg Ticket (Solo)</TableHead>
                      <TableHead className="text-right">Avg Ticket (Grouped)</TableHead>
                      <TableHead className="text-right">Lift ($)</TableHead>
                      <TableHead className="text-right">Lift (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueLift.map(r => (
                      <TableRow key={r.category} className={cn(r.liftPct >= 50 && 'bg-emerald-500/5')}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {r.category}
                            {r.liftPct >= 50 && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Strong</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums"><BlurredAmount>{formatCurrency(r.avgTicketSolo)}</BlurredAmount></TableCell>
                        <TableCell className="text-right tabular-nums"><BlurredAmount>{formatCurrency(r.avgTicketGrouped)}</BlurredAmount></TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                          <BlurredAmount>+{formatCurrency(r.liftDollars)}</BlurredAmount>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                          +{Math.round(r.liftPct)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Category Pairing Heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <ArrowUpDown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base tracking-wide">CATEGORY PAIRING HEATMAP</CardTitle>
                  <MetricInfoTooltip description="Shows how often service categories are booked together in multi-service visits. Darker cells indicate stronger natural affinities between categories." />
                </div>
                <CardDescription>How frequently categories are booked together</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {heatmapCats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No multi-service visits found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-medium text-muted-foreground" />
                      {heatmapCats.map(cat => (
                        <th key={cat} className="p-2 text-center font-medium text-muted-foreground max-w-[80px] truncate">
                          {cat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapCats.map(rowCat => (
                      <tr key={rowCat}>
                        <td className="p-2 font-medium text-muted-foreground whitespace-nowrap">{rowCat}</td>
                        {heatmapCats.map(colCat => {
                          if (rowCat === colCat) {
                            return (
                              <td key={colCat} className="p-2 text-center">
                                <div className="w-full h-10 bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-[10px]">
                                  —
                                </div>
                              </td>
                            );
                          }
                          const pair = pairMap.get(`${rowCat}|||${colCat}`);
                          if (!pair) {
                            return (
                              <td key={colCat} className="p-2 text-center">
                                <div className="w-full h-10 bg-muted/10 rounded flex items-center justify-center text-muted-foreground/40 text-[10px]">
                                  0
                                </div>
                              </td>
                            );
                          }
                          const intensity = Math.min(pair.count / maxCount, 1);
                          return (
                            <td key={colCat} className="p-2 text-center">
                              <div
                                className="w-full h-10 rounded flex flex-col items-center justify-center transition-colors"
                                style={{
                                  backgroundColor: `hsl(var(--primary) / ${0.08 + intensity * 0.45})`,
                                }}
                              >
                                <span className="font-bold text-[11px]">{pair.count}</span>
                                <span className="text-[9px] text-muted-foreground">{Math.round(pair.pct)}%</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3 px-1">
                  Cell values show pairing count and % of multi-service visits. Darker = more common pairing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PinnableCard>
  );
}
