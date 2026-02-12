import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useServiceProductDrilldown } from '@/hooks/useServiceProductDrilldown';
import { useCapacityReport } from '@/hooks/useCapacityReport';
import { useSalesComparison } from '@/hooks/useSalesComparison';
import { TrendingUp, TrendingDown, Clock, Users, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ZuraAvatar } from '@/components/ui/ZuraAvatar';
import { cn } from '@/lib/utils';

interface LocationDrilldownPanelProps {
  locationId: string;
  dateFrom: string;
  dateTo: string;
  serviceRevenue: number;
  productRevenue: number;
  isOpen: boolean;
}

export function LocationDrilldownPanel({
  locationId,
  dateFrom,
  dateTo,
  serviceRevenue,
  productRevenue,
  isOpen,
}: LocationDrilldownPanelProps) {
  // Lazy-load data only when panel is open
  const { data: drilldown, isLoading: drilldownLoading } = useServiceProductDrilldown({
    dateFrom,
    dateTo,
    locationId,
  });

  const { data: capacity, isLoading: capacityLoading } = useCapacityReport(
    dateFrom,
    dateTo,
    locationId,
  );

  const { data: comparison, isLoading: comparisonLoading } = useSalesComparison(
    dateFrom,
    dateTo,
    locationId,
  );

  const totalSplit = serviceRevenue + productRevenue;
  const servicePct = totalSplit > 0 ? (serviceRevenue / totalSplit) * 100 : 0;
  const productPct = totalSplit > 0 ? (productRevenue / totalSplit) * 100 : 0;

  const topStylists = useMemo(() => {
    if (!drilldown?.staffData) return [];
    return [...drilldown.staffData]
      .sort((a, b) => b.serviceRevenue - a.serviceRevenue)
      .slice(0, 3);
  }, [drilldown]);

  const revenueChange = comparison?.percentChange?.totalRevenue;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="pt-4 pb-2 space-y-4">
            {/* Revenue Breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
                  Revenue Split
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex bg-muted/50">
                <motion.div
                  className="h-full bg-primary/70 rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${servicePct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.div
                  className="h-full bg-accent/70 rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${productPct}%` }}
                  transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>Services <BlurredAmount>${Math.round(serviceRevenue).toLocaleString()}</BlurredAmount> ({Math.round(servicePct)}%)</span>
                <span>Products <BlurredAmount>${Math.round(productRevenue).toLocaleString()}</BlurredAmount> ({Math.round(productPct)}%)</span>
              </div>
            </div>

            {/* Top 3 Stylists */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
                  Top Stylists
                </span>
              </div>
              {drilldownLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
                </div>
              ) : topStylists.length > 0 ? (
                <div className="space-y-1.5">
                  {topStylists.map((stylist, i) => (
                    <motion.div
                      key={stylist.phorestStaffId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                      <ZuraAvatar size="sm" />
                      <span className="text-sm font-medium flex-1 truncate">{stylist.staffName}</span>
                      <span className="text-sm font-display tabular-nums">
                        <BlurredAmount>${Math.round(stylist.serviceRevenue).toLocaleString()}</BlurredAmount>
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-2">No stylist data available</p>
              )}
            </div>

            {/* Peak Hour + Period Comparison */}
            <div className="grid grid-cols-2 gap-3">
              {/* Peak Hour */}
              <div className="p-3 rounded-lg border border-border/30 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Peak Hour</span>
                </div>
                {capacityLoading ? (
                  <Skeleton className="h-6 w-16 rounded" />
                ) : (
                  <p className="text-lg font-display">{capacity?.peakHour || 'N/A'}</p>
                )}
              </div>

              {/* Period Comparison */}
              <div className="p-3 rounded-lg border border-border/30 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">vs Prior Period</span>
                </div>
                {comparisonLoading ? (
                  <Skeleton className="h-6 w-16 rounded" />
                ) : revenueChange !== undefined ? (
                  <div className="flex items-center gap-1.5">
                    {revenueChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : revenueChange < 0 ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={cn(
                      'text-lg font-display',
                      revenueChange > 0 && 'text-emerald-500',
                      revenueChange < 0 && 'text-red-400',
                    )}>
                      {revenueChange > 0 ? '+' : ''}{Math.round(revenueChange)}%
                    </span>
                  </div>
                ) : (
                  <p className="text-lg font-display text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
