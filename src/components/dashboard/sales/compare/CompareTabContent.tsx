import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GitCompare } from 'lucide-react';
import { format } from 'date-fns';
import { useLocations } from '@/hooks/useLocations';
import { useComparisonData, getPresetPeriods, type CompareMode } from '@/hooks/useComparisonData';
import { CompareTypeSelector } from './CompareTypeSelector';
import { PeriodSelector } from './PeriodSelector';
import { ComparisonResultsGrid } from './ComparisonResultsGrid';
import { ComparisonChart } from './ComparisonChart';
import { ComparisonBreakdownTable } from './ComparisonBreakdownTable';
import { LocationComparisonView } from './LocationComparisonView';
import { CategoryComparisonTable } from './CategoryComparisonTable';
import { WaterfallChart } from '@/components/dashboard/analytics/charts/WaterfallChart';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';

interface CompareTabContentProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    locationId: string;
    dateRange: string;
  };
  filterContext?: FilterContext;
}

export function CompareTabContent({ filters, filterContext }: CompareTabContentProps) {
  const { data: locations } = useLocations();
  
  // State for comparison configuration
  const [mode, setMode] = useState<CompareMode>('time');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  
  // Period state - initialized with defaults
  const defaultPeriods = getPresetPeriods('thisMonth-lastMonth');
  const [periodA, setPeriodA] = useState(defaultPeriods.periodA);
  const [periodB, setPeriodB] = useState(defaultPeriods.periodB);

  // Update periods when mode changes to YoY
  useEffect(() => {
    if (mode === 'yoy') {
      const yoyPeriods = getPresetPeriods('thisYear-lastYear');
      setPeriodA(yoyPeriods.periodA);
      setPeriodB(yoyPeriods.periodB);
    }
  }, [mode]);

  // Initialize selected locations from filter
  useEffect(() => {
    if (locations && locations.length > 0 && selectedLocationIds.length === 0) {
      setSelectedLocationIds(locations.slice(0, 2).map(l => l.id));
    }
  }, [locations]);

  // Get comparison data
  const { data, isLoading } = useComparisonData({
    mode,
    periodA,
    periodB,
    locationIds: mode === 'location' ? selectedLocationIds : (filters.locationId !== 'all' ? [filters.locationId] : undefined),
  });

  // Handle period changes
  const handlePeriodsChange = (newPeriodA: typeof periodA, newPeriodB: typeof periodB) => {
    setPeriodA(newPeriodA);
    setPeriodB(newPeriodB);
  };

  // Handle location selection toggle
  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Generate period labels
  const periodALabel = `${format(new Date(periodA.dateFrom), 'MMM d')} - ${format(new Date(periodA.dateTo), 'MMM d, yyyy')}`;
  const periodBLabel = `${format(new Date(periodB.dateFrom), 'MMM d')} - ${format(new Date(periodB.dateTo), 'MMM d, yyyy')}`;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
                <GitCompare className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="font-display text-base tracking-wide">COMPARISON BUILDER</CardTitle>
            </div>
            {filterContext && (
              <AnalyticsFilterBadge 
                locationId={filterContext.locationId} 
                dateRange={filterContext.dateRange} 
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selector */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Compare by:</p>
            <CompareTypeSelector value={mode} onChange={setMode} />
          </div>

          {/* Location Selector (only in location mode) */}
          {mode === 'location' && locations && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select locations to compare:</p>
              <div className="flex flex-wrap gap-3">
                {locations.map(location => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={location.id}
                      checked={selectedLocationIds.includes(location.id)}
                      onCheckedChange={() => toggleLocation(location.id)}
                    />
                    <Label htmlFor={location.id} className="text-sm cursor-pointer">
                      {location.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Period Selector */}
          <PeriodSelector
            periodA={periodA}
            periodB={periodB}
            onPeriodsChange={handlePeriodsChange}
            mode={mode}
          />
        </CardContent>
      </Card>

      {/* Results Section - Based on Mode */}
      {mode === 'location' ? (
        <LocationComparisonView 
          locations={data?.locationBreakdown} 
          isLoading={isLoading} 
        />
      ) : mode === 'category' ? (
        <>
          <ComparisonResultsGrid data={data} isLoading={isLoading} />
          <CategoryComparisonTable 
            categories={data?.categoryBreakdown}
            isLoading={isLoading}
            periodALabel={periodALabel}
            periodBLabel={periodBLabel}
          />
        </>
      ) : (
        <>
          {/* Standard Results Grid */}
          <ComparisonResultsGrid data={data} isLoading={isLoading} />

          {/* Waterfall Chart - shows revenue breakdown */}
          {data?.waterfall && data.waterfall.length > 0 && (
            <WaterfallChart
              data={data.waterfall}
              startValue={data.periodB.totalRevenue}
              endValue={data.periodA.totalRevenue}
              periodALabel={periodBLabel}
              periodBLabel={periodALabel}
              isLoading={isLoading}
              title="Revenue Change Breakdown"
            />
          )}

          {/* Chart and Table */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ComparisonChart 
              data={data} 
              isLoading={isLoading}
              periodALabel={periodALabel}
              periodBLabel={periodBLabel}
            />
            <ComparisonBreakdownTable 
              data={data} 
              isLoading={isLoading}
              periodALabel={periodALabel}
              periodBLabel={periodBLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}
