import { MapPin, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveLocations } from '@/hooks/useLocations';
import type { DateRangeType } from '@/components/dashboard/sales/SalesBentoCard';

const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
};

interface AnalyticsFilterBarProps {
  locationId: string;
  onLocationChange: (value: string) => void;
  dateRange: DateRangeType;
  onDateRangeChange: (value: DateRangeType) => void;
}

/**
 * Shared filter bar for analytics cards.
 * Renders location and date range selectors at the top of the dashboard
 * when any pinned analytics cards are visible.
 */
export function AnalyticsFilterBar({
  locationId,
  onLocationChange,
  dateRange,
  onDateRangeChange,
}: AnalyticsFilterBarProps) {
  const { data: locations } = useActiveLocations();
  
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Location Select */}
      <Select value={locationId} onValueChange={onLocationChange}>
        <SelectTrigger className="h-9 w-auto min-w-[180px] text-sm">
          <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations?.map(loc => (
            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Date Range Select */}
      <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRangeType)}>
        <SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(DATE_RANGE_LABELS) as DateRangeType[]).map((key) => (
            <SelectItem key={key} value={key}>
              {DATE_RANGE_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
