import { Users, UserCheck, RefreshCw, Receipt, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useClientEngagement } from '@/hooks/useClientEngagement';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StaffKPISummaryProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-medium',
      isPositive ? 'text-green-500' : isNeutral ? 'text-muted-foreground' : 'text-red-500'
    )}>
      <Icon className="w-3 h-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function StaffKPISummary({ dateFrom, dateTo, locationId }: StaffKPISummaryProps) {
  const { data, isLoading } = useClientEngagement(dateFrom, dateTo, locationId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const avgTicket = data.visits.total > 0
    ? data.visits.staffBreakdown.reduce((sum, s) => sum + s.avgTicket * s.totalVisits, 0) / data.visits.total
    : 0;

  const tiles = [
    {
      icon: Users,
      label: 'Total Visits',
      value: data.visits.total.toLocaleString(),
      change: data.visits.percentChange,
    },
    {
      icon: UserCheck,
      label: 'Returning %',
      value: `${Math.round(data.retention.overallRate)}%`,
      change: data.retention.percentChange,
    },
    {
      icon: RefreshCw,
      label: 'Rebooking %',
      value: `${Math.round(data.rebooking.overallRate)}%`,
      change: data.rebooking.percentChange,
    },
    {
      icon: Receipt,
      label: 'Avg Ticket',
      value: <AnimatedBlurredAmount value={avgTicket} currency="USD" />,
      change: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-1"
        >
          <div className="flex items-center gap-1.5">
            <tile.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {tile.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-medium">{tile.value}</span>
            <ChangeBadge value={tile.change} />
          </div>
        </div>
      ))}
    </div>
  );
}
