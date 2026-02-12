import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, LayoutGrid, TableProperties } from 'lucide-react';
import { AnalyticsFilterBadge, FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { LocationComparisonCard } from './location-comparison/LocationComparisonCard';
import { LocationComparisonTable } from './location-comparison/LocationComparisonTable';
import type { LocationCardData } from './location-comparison/LocationComparisonCard';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface LocationData {
  location_id: string;
  name: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalTransactions: number;
  totalServices: number;
  totalProducts: number;
}

interface LocationComparisonProps {
  locations: LocationData[];
  isLoading?: boolean;
  filterContext?: FilterContext;
  dateFrom?: string;
  dateTo?: string;
}

type ViewMode = 'cards' | 'table';

export function LocationComparison({ locations, isLoading, filterContext, dateFrom = '', dateTo = '' }: LocationComparisonProps) {
  const count = locations.length;
  const autoTier = count <= 5 ? 1 : count <= 20 ? 2 : 3;

  const [viewMode, setViewMode] = useState<ViewMode>(autoTier === 1 ? 'cards' : 'table');

  const totalRevenue = useMemo(() => locations.reduce((s, l) => s + l.totalRevenue, 0), [locations]);

  const sortedLocations = useMemo(() => [...locations].sort((a, b) => b.totalRevenue - a.totalRevenue), [locations]);

  const cardData: LocationCardData[] = useMemo(() => {
    const leader = sortedLocations[0];
    const lowest = sortedLocations[sortedLocations.length - 1];
    return sortedLocations.map((loc, i) => ({
      ...loc,
      rank: i + 1,
      sharePercent: totalRevenue > 0 ? (loc.totalRevenue / totalRevenue) * 100 : 0,
      isLeader: loc.location_id === leader?.location_id,
      isLowest: sortedLocations.length > 1 && loc.location_id === lowest?.location_id,
    }));
  }, [sortedLocations, totalRevenue]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (count < 2) return null;

  const leader = sortedLocations[0];
  const trailing = sortedLocations[sortedLocations.length - 1];
  const gap = leader.totalRevenue - trailing.totalRevenue;
  const gapPercent = trailing.totalRevenue > 0 ? ((gap / trailing.totalRevenue) * 100).toFixed(0) : '∞';

  const showViewToggle = autoTier <= 2;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-base tracking-wide">LOCATION COMPARISON</span>
          </div>
          <div className="flex items-center gap-2">
            {filterContext && (
              <AnalyticsFilterBadge
                locationId={filterContext.locationId}
                dateRange={filterContext.dateRange}
              />
            )}
            <Badge variant="secondary">
              <BlurredAmount>${totalRevenue.toLocaleString()}</BlurredAmount> total
            </Badge>
            {showViewToggle && (
              <div className="flex items-center border rounded-md overflow-hidden ml-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'p-1.5 transition-colors',
                    viewMode === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-1.5 transition-colors',
                    viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <TableProperties className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === 'cards' ? (
          <div className={cn(
            "grid gap-4",
            count === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {cardData.map((loc, i) => (
              <LocationComparisonCard
                key={loc.location_id}
                location={loc}
                gapPercent={gapPercent}
                dateFrom={dateFrom}
                dateTo={dateTo}
                color={COLORS[i % COLORS.length]}
              />
            ))}
          </div>
        ) : (
          <LocationComparisonTable
            locations={cardData}
            totalRevenue={totalRevenue}
            dateFrom={dateFrom}
            dateTo={dateTo}
            showSearch={autoTier === 3}
            colors={COLORS}
          />
        )}
      </CardContent>
    </Card>
  );
}
