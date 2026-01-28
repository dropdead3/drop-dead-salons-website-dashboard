import { MapPin, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveLocations } from '@/hooks/useLocations';
import type { DateRangeType } from '@/components/dashboard/PinnedAnalyticsCard';

const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
};

interface Location {
  id: string;
  name: string;
}

interface AnalyticsFilterBarProps {
  locationId: string;
  onLocationChange: (value: string) => void;
  dateRange: DateRangeType;
  onDateRangeChange: (value: DateRangeType) => void;
  /** Restrict dropdown to only these locations (if provided) */
  accessibleLocations?: Location[];
  /** Whether the "All Locations" aggregate option should be shown */
  canViewAggregate?: boolean;
}

/**
 * Shared filter bar for analytics cards.
 * Renders location and date range selectors at the top of the dashboard
 * when any pinned analytics cards are visible.
 * 
 * Supports location-based access control:
 * - If accessibleLocations is provided, only those locations are shown
 * - If canViewAggregate is false, "All Locations" option is hidden
 * - If only one location and no aggregate, shows a static badge instead
 */
export function AnalyticsFilterBar({
  locationId,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  accessibleLocations,
  canViewAggregate = true,
}: AnalyticsFilterBarProps) {
  const { data: allLocations } = useActiveLocations();
  
  // Use provided accessible locations or fall back to all locations
  const locations = accessibleLocations ?? allLocations;
  
  // Determine if we should show the location selector
  // Hide if: only one location AND no aggregate view allowed
  const showLocationSelector = canViewAggregate || (locations?.length ?? 0) > 1;
  
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Location Select - conditionally rendered based on access */}
      {showLocationSelector && (
        <Select value={locationId} onValueChange={onLocationChange}>
          <SelectTrigger className="h-9 w-auto min-w-[180px] text-sm">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            {canViewAggregate && (
              <SelectItem value="all">All Locations</SelectItem>
            )}
            {locations?.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Single location badge (when only one location assigned and no aggregate) */}
      {!showLocationSelector && locations?.length === 1 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm h-9">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{locations[0].name}</span>
        </div>
      )}
      
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
