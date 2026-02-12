import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { LocationDrilldownPanel } from './LocationDrilldownPanel';

export interface LocationCardData {
  location_id: string;
  name: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  totalServices: number;
  totalProducts: number;
  rank: number;
  sharePercent: number;
  isLeader: boolean;
  isLowest: boolean;
}

interface LocationComparisonCardProps {
  location: LocationCardData;
  gapPercent: string;
  dateFrom: string;
  dateTo: string;
  color: string;
}

export function LocationComparisonCard({
  location,
  gapPercent,
  dateFrom,
  dateTo,
  color,
}: LocationComparisonCardProps) {
  const [expanded, setExpanded] = useState(false);

  const avgTicket = location.totalTransactions > 0
    ? Math.round(location.totalRevenue / location.totalTransactions)
    : 0;

  const revTotal = location.serviceRevenue + location.productRevenue;
  const servicePct = revTotal > 0 ? Math.round((location.serviceRevenue / revTotal) * 100) : 0;
  const productPct = 100 - servicePct;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border relative overflow-hidden transition-colors cursor-pointer',
        location.isLeader
          ? 'bg-primary/5 border-primary/20'
          : location.isLowest
            ? 'bg-muted/20 border-border/40'
            : 'bg-muted/30 border-border/40',
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: color }}
      />
      <div className="pl-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm font-medium truncate">{location.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {location.isLeader ? (
              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Leader
              </Badge>
            ) : location.isLowest ? (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
                Opportunity
              </Badge>
            ) : null}
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              expanded && 'rotate-180'
            )} />
          </div>
        </div>

        {/* Revenue */}
        <p className="text-2xl font-display mb-2">
          <BlurredAmount>${location.totalRevenue.toLocaleString()}</BlurredAmount>
        </p>

        {/* Share bar — colored to match location */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Share of total</span>
            <span>{Math.round(location.sharePercent)}%</span>
          </div>
          <Progress
            value={location.sharePercent}
            className="h-1.5"
            indicatorStyle={{ backgroundColor: color }}
          />
        </div>

        {/* Service vs Product ratio mini bar */}
        {revTotal > 0 && (
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Services vs Products</span>
              <span>{servicePct}% / {productPct}%</span>
            </div>
            <TooltipProvider delayDuration={100}>
              <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-secondary">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${servicePct}%`, backgroundColor: color }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Services: {servicePct}%</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full bg-muted-foreground/25 transition-all"
                      style={{ width: `${productPct}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Products: {productPct}%</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Metric grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30 text-center">
          <div>
            <p className="text-lg font-display">{location.totalServices}</p>
            <p className="text-xs text-muted-foreground">Services</p>
          </div>
          <div>
            <p className="text-lg font-display">{location.totalProducts}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </div>
          <div>
            <p className="text-lg font-display">
              <BlurredAmount>${avgTicket}</BlurredAmount>
            </p>
            <p className="text-xs text-muted-foreground">Avg Ticket</p>
          </div>
        </div>

        {/* Drill-down panel */}
        <LocationDrilldownPanel
          locationId={location.location_id}
          dateFrom={dateFrom}
          dateTo={dateTo}
          serviceRevenue={location.serviceRevenue}
          productRevenue={location.productRevenue}
          isOpen={expanded}
        />
      </div>
    </div>
  );
}
