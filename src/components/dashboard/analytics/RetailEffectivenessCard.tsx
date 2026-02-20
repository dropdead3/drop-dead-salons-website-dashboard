import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { useDailySalesSummary } from '@/hooks/useSalesData';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { useRetailAttachmentRate } from '@/hooks/useRetailAttachmentRate';
import { tokens } from '@/lib/design-tokens';

export interface RetailEffectivenessCardProps {
  filterContext: FilterContext;
  dateFrom: string;
  dateTo: string;
  locationId: string;
}

export function RetailEffectivenessCard({
  filterContext,
  dateFrom,
  dateTo,
  locationId,
}: RetailEffectivenessCardProps) {
  const locationFilter = locationId === 'all' ? undefined : locationId;
  const { data: dailyRows, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useDailySalesSummary({
    dateFrom,
    dateTo,
    locationId: locationFilter,
  });
  const { data: attachment, isLoading: attachmentLoading, isError: attachmentError, refetch: refetchAttachment } = useRetailAttachmentRate({
    dateFrom,
    dateTo,
    locationId: locationFilter,
  });

  const { formatCurrencyWhole } = useFormatCurrency();
  const { serviceRevenue, productRevenue, totalRevenue } = useMemo(() => {
    let service = 0;
    let product = 0;
    (dailyRows || []).forEach((row: { service_revenue?: number | null; product_revenue?: number | null }) => {
      service += Number(row.service_revenue) || 0;
      product += Number(row.product_revenue) || 0;
    });
    return { serviceRevenue: service, productRevenue: product, totalRevenue: service + product };
  }, [dailyRows]);

  const isLoading = summaryLoading || attachmentLoading;
  const isError = summaryError || attachmentError;
  const retailPercent = totalRevenue > 0 ? (productRevenue / totalRevenue) * 100 : 0;
  const attachmentRate = attachment?.attachmentRate ?? 0;

  if (isError) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load retail data.</span>
          </div>
          <Button variant="outline" size={tokens.button.card} className="mt-3" onClick={() => { refetchSummary(); refetchAttachment(); }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              data-pinnable-anchor
              className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg shrink-0"
            >
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm tracking-wide text-muted-foreground uppercase truncate">
                Retail Effectiveness
              </h3>
              <MetricInfoTooltip description="Measures retail sales performance: product revenue as a share of total revenue and the attachment rate (percentage of service transactions that included a product sale)." />
            </div>
          </div>
          <AnalyticsFilterBadge
            locationId={filterContext.locationId}
            dateRange={filterContext.dateRange}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Retail % of Revenue</span>
            </div>
            <p className="font-medium text-xl tabular-nums">{retailPercent.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <BlurredAmount>{formatCurrencyWhole(productRevenue)}</BlurredAmount> product
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Attachment Rate</span>
            </div>
            <p className="font-medium text-xl tabular-nums">{attachmentRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Service visits with retail
            </p>
          </div>
        </div>
        {totalRevenue === 0 && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
            Revenue from daily summary; sync or date range may affect numbers.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
