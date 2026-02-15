import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '@/lib/formatCurrency';
import { useFormatNumber } from '@/hooks/useFormatNumber';

export interface LocationBreakdownItem {
  locationId: string;
  locationName: string;
  value: number;
}

interface LocationBreakdownSectionProps {
  data: LocationBreakdownItem[];
  format: 'currency' | 'number' | 'percent';
  isAllLocations: boolean;
  className?: string;
}

export function LocationBreakdownSection({
  data,
  format,
  isAllLocations,
  className,
}: LocationBreakdownSectionProps) {
  const { formatNumber } = useFormatNumber();

  // Only show when viewing "All Locations" and when multiple locations have data
  if (!isAllLocations || data.length <= 1) {
    return null;
  }

  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return formatCurrencyWhole(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return formatNumber(value);
    }
  };

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className={cn('mt-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          By Location
        </span>
      </div>
      <div className="space-y-2">
        {sortedData.map((loc) => (
          <div
            key={loc.locationId}
            className="flex items-center justify-between p-2 bg-muted/20 rounded-md border border-border/30"
          >
            <span className="text-sm truncate max-w-[150px]">{loc.locationName}</span>
            <span className="font-display tabular-nums text-sm">{formatValue(loc.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
