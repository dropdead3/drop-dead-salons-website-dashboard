import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BlurredAmount, useHideNumbers } from '@/contexts/HideNumbersContext';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Scissors, 
  ShoppingBag, 
  Receipt,
  CreditCard,
  MapPin,
  Building2,
  Download,
  Info,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useSalesMetrics, useSalesByStylist, useSalesByLocation, useSalesTrend } from '@/hooks/useSalesData';
import { useActiveLocations } from '@/hooks/useLocations';
import { useTomorrowRevenue } from '@/hooks/useTomorrowRevenue';
import { useSalesComparison } from '@/hooks/useSalesComparison';
import { useTodayActualRevenue } from '@/hooks/useTodayActualRevenue';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useGoalPeriodRevenue } from '@/hooks/useGoalPeriodRevenue';
import { format, subDays, startOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useMemo } from 'react';

import { ServiceProductDrilldown } from './ServiceProductDrilldown';
import { TipsDrilldownPanel } from './sales/TipsDrilldownPanel';
import { TransactionsByHourPanel } from './sales/TransactionsByHourPanel';
import { TicketDistributionPanel } from './sales/TicketDistributionPanel';
import { RevPerHourByStylistPanel } from './sales/RevPerHourByStylistPanel';
import { useNavigate } from 'react-router-dom';

// Sub-components
import { SalesTrendIndicator } from './sales/SalesTrendIndicator';
import { TrendSparkline } from './TrendSparkline';
import { TopPerformersCard } from './sales/TopPerformersCard';
import { RevenueDonutChart } from './sales/RevenueDonutChart';
import { SalesGoalProgress } from './sales/SalesGoalProgress';
import { LastSyncIndicator } from './sales/LastSyncIndicator';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { AnalyticsFilterBadge, type FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { Progress } from '@/components/ui/progress';

export type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'mtd' | 'todayToEom' | 'ytd' | 'lastYear' | 'last365';

/** Wrapper that fetches goal-period revenue independently of the dashboard filter */
function GoalProgressWithOwnRevenue({ goalPeriod, locationId, target, label, hoursJson, holidayClosures }: {
  goalPeriod: 'weekly' | 'monthly';
  locationId?: string;
  target: number;
  label: string;
  hoursJson?: any;
  holidayClosures?: any;
}) {
  const { data: goalRevenue = 0 } = useGoalPeriodRevenue(goalPeriod, locationId);
  return (
    <SalesGoalProgress
      current={goalRevenue}
      target={target}
      label={label}
      goalPeriod={goalPeriod}
      hoursJson={hoursJson}
      holidayClosures={holidayClosures}
    />
  );
}

/** Format HH:MM:SS to 12-hour time like "7:45 PM" */
function formatEndTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

interface AggregateSalesCardProps {
  // When provided, use these instead of internal state
  externalDateRange?: DateRange;
  externalDateFilters?: { dateFrom: string; dateTo: string };
  // Hide the internal date selector when using external filters
  hideInternalFilter?: boolean;
  // Optional filter context for pinned card display
  filterContext?: {
    locationId: string;
    dateRange: string;
  };
}

export function AggregateSalesCard({ 
  externalDateRange,
  externalDateFilters,
  hideInternalFilter = false,
  filterContext,
}: AggregateSalesCardProps = {}) {
  const navigate = useNavigate();
  const [internalDateRange, setInternalDateRange] = useState<DateRange>('today');
  const [drilldownMode, setDrilldownMode] = useState<'services' | 'products' | null>(null);
  const [tipsDrilldownOpen, setTipsDrilldownOpen] = useState(false);
  const [activeDrilldown, setActiveDrilldown] = useState<'transactions' | 'avgTicket' | 'revPerHour' | null>(null);
  const { hideNumbers } = useHideNumbers();

  // Toggle a secondary KPI drilldown with mutual exclusivity
  const toggleDrilldown = (panel: 'transactions' | 'avgTicket' | 'revPerHour') => {
    setActiveDrilldown(prev => prev === panel ? null : panel);
    setTipsDrilldownOpen(false); // Close tips when opening another
  };

  const handleTipsToggle = () => {
    setTipsDrilldownOpen(prev => !prev);
    setActiveDrilldown(null); // Close others when opening tips
  };

  // Location table sorting
  type LocationSortField = 'name' | 'totalRevenue' | 'serviceRevenue' | 'productRevenue' | 'totalTransactions' | 'avgTicket';
  type SortDirection = 'asc' | 'desc';
  const [locationSortField, setLocationSortField] = useState<LocationSortField>('totalRevenue');
  const [locationSortDirection, setLocationSortDirection] = useState<SortDirection>('desc');

  // Collapsible locations + region filter
  const [locationsExpanded, setLocationsExpanded] = useState(false);
  const [regionFilter, setRegionFilter] = useState('all');
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);

  // Use external if provided, otherwise internal
  const dateRange = externalDateRange ?? internalDateRange;

  const dateFilters = externalDateFilters ?? (() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { dateFrom: format(now, 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { dateFrom: format(yesterday, 'yyyy-MM-dd'), dateTo: format(yesterday, 'yyyy-MM-dd') };
      case '7d':
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case '30d':
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case 'thisWeek':
        return { 
          dateFrom: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), 
          dateTo: format(now, 'yyyy-MM-dd') 
        };
      case 'mtd':
        return { 
          dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'), 
          dateTo: format(now, 'yyyy-MM-dd') 
        };
      case 'todayToEom':
        return { 
          dateFrom: format(now, 'yyyy-MM-dd'), 
          dateTo: format(endOfMonth(now), 'yyyy-MM-dd') 
        };
      case 'ytd':
        return { 
          dateFrom: format(startOfYear(now), 'yyyy-MM-dd'), 
          dateTo: format(now, 'yyyy-MM-dd') 
        };
      case 'lastYear':
        const lastYearDate = subYears(now, 1);
        return { 
          dateFrom: format(startOfYear(lastYearDate), 'yyyy-MM-dd'), 
          dateTo: format(endOfYear(lastYearDate), 'yyyy-MM-dd') 
        };
      case 'last365':
        return { 
          dateFrom: format(subDays(now, 365), 'yyyy-MM-dd'), 
          dateTo: format(now, 'yyyy-MM-dd') 
        };
      default:
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    }
  })();

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(dateFilters);
  const { data: locationData, isLoading: locationLoading } = useSalesByLocation(dateFilters.dateFrom, dateFilters.dateTo);
  const { data: stylistData, isLoading: stylistLoading } = useSalesByStylist(dateFilters.dateFrom, dateFilters.dateTo);
  const { data: trendData, isLoading: trendLoading } = useSalesTrend(dateFilters.dateFrom, dateFilters.dateTo);
  const { data: comparison, isLoading: comparisonLoading } = useSalesComparison(dateFilters.dateFrom, dateFilters.dateTo);
  const { data: tomorrowData } = useTomorrowRevenue();
  const { goals } = useSalesGoals();
  const { data: locations } = useActiveLocations();
  const { data: todayActual, locationActuals, isLoading: todayActualLoading } = useTodayActualRevenue(dateRange === 'today');
  // Drilldown data now fetched inside the dialog component itself
  const isToday = dateRange === 'today';

  // Location display logic
  const isAllLocations = !filterContext?.locationId || filterContext.locationId === 'all';
  const selectedLocationName = !isAllLocations 
    ? locations?.find(loc => loc.id === filterContext.locationId)?.name 
    : null;

  const isLoading = metricsLoading || locationLoading;

  // Calculate revenue per hour
  const revenuePerHour = (() => {
    const serviceHours = metrics?.totalServiceHours || 0;
    if (serviceHours === 0) return 0;
    return (metrics?.totalRevenue || 0) / serviceHours;
  })();

  // Calculate revenue breakdown percentages
  const totalRevenueSum = (metrics?.serviceRevenue || 0) + (metrics?.productRevenue || 0);
  const servicePercent = totalRevenueSum > 0 
    ? Math.round(((metrics?.serviceRevenue || 0) / totalRevenueSum) * 100) 
    : 0;
  const productPercent = totalRevenueSum > 0 
    ? Math.round(((metrics?.productRevenue || 0) / totalRevenueSum) * 100) 
    : 0;

  // Calculate goal based on date range, accounting for single-location view
  const currentGoal = (() => {
    let globalTarget: number;
    switch (dateRange) {
      case 'mtd':
      case '30d':
        globalTarget = goals?.monthlyTarget || 50000;
        break;
      case 'ytd':
      case 'lastYear':
      case 'last365':
        globalTarget = (goals?.monthlyTarget || 50000) * 12;
        break;
      default:
        globalTarget = goals?.weeklyTarget || 12500;
        break;
    }

    // When viewing a single location, use location-specific target or divide evenly
    if (!isAllLocations && filterContext?.locationId) {
      const period = (dateRange === 'mtd' || dateRange === '30d') ? 'monthly' : 'weekly';
      const locTargets = goals?.locationTargets?.[filterContext.locationId];
      if (locTargets) {
        return period === 'monthly' ? locTargets.monthly : locTargets.weekly;
      }
      // Fallback: divide global target by number of active locations
      const locationCount = locations?.length || 1;
      return Math.round(globalTarget / locationCount);
    }

    return globalTarget;
  })();

  // Get goal label based on date range
  const goalLabel = (() => {
    switch (dateRange) {
      case 'mtd':
      case '30d':
        return 'Monthly Goal';
      case 'ytd':
      case 'lastYear':
      case 'last365':
        return 'Yearly Goal';
      default:
        return 'Weekly Goal';
    }
  })();

  // Check if comparison data is available for trend indicators
  const showTrendIndicators = comparison && !['lastYear', 'last365'].includes(dateRange);

  // Get trend data for a specific location
  const getLocationTrend = (locationId: string | null) => {
    if (!trendData || !locationId) return [];
    return trendData.byLocation?.[locationId] || [];
  };

  // Location sort handlers
  const handleLocationSort = (field: LocationSortField) => {
    if (locationSortField === field) {
      setLocationSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLocationSortField(field);
      setLocationSortDirection('desc');
    }
  };

  const getLocationSortIcon = (field: LocationSortField) => {
    if (locationSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    }
    return locationSortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  // Derive available regions from locations data (use state_province or city)
  const availableRegions = useMemo(() => {
    if (!locations) return [];
    const regions = new Set<string>();
    locations.forEach(loc => {
      const region = loc.state_province || loc.city?.split(',')[1]?.trim().split(' ')[0] || '';
      if (region) regions.add(region);
    });
    return Array.from(regions).sort();
  }, [locations]);

  // Build a map of location_id -> region for filtering
  const locationRegionMap = useMemo(() => {
    const map: Record<string, string> = {};
    locations?.forEach(loc => {
      map[loc.id] = loc.state_province || loc.city?.split(',')[1]?.trim().split(' ')[0] || '';
    });
    return map;
  }, [locations]);

  // Sorted location data
  const sortedLocationData = useMemo(() => {
    if (!locationData) return [];
    return [...locationData].sort((a, b) => {
      let aVal: number, bVal: number;
      if (locationSortField === 'avgTicket') {
        aVal = a.totalTransactions > 0 ? a.totalRevenue / a.totalTransactions : 0;
        bVal = b.totalTransactions > 0 ? b.totalRevenue / b.totalTransactions : 0;
      } else if (locationSortField === 'name') {
        return locationSortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else {
        aVal = a[locationSortField] ?? 0;
        bVal = b[locationSortField] ?? 0;
      }
      return locationSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [locationData, locationSortField, locationSortDirection]);

  // Filtered location data (by region)
  const filteredLocationData = useMemo(() => {
    if (regionFilter === 'all') return sortedLocationData;
    return sortedLocationData.filter(loc => {
      const region = locationRegionMap[loc.location_id || ''] || '';
      return region === regionFilter;
    });
  }, [sortedLocationData, regionFilter, locationRegionMap]);

  // Visible locations (collapsed = top 5, expanded = all)
  const COLLAPSED_COUNT = 5;
  const visibleLocationData = useMemo(() => {
    if (locationsExpanded || filteredLocationData.length <= COLLAPSED_COUNT) return filteredLocationData;
    return filteredLocationData.slice(0, COLLAPSED_COUNT);
  }, [filteredLocationData, locationsExpanded]);

  // Export CSV
  const handleExportCSV = () => {
    if (!locationData) return;
    
    const headers = ['Location', 'Total Revenue', 'Service Revenue', 'Product Revenue', 'Transactions', 'Avg Ticket'];
    const rows = locationData.map(loc => {
      const avgTicket = loc.totalTransactions > 0 ? loc.totalRevenue / loc.totalTransactions : 0;
      return [
        loc.name,
        loc.totalRevenue.toFixed(2),
        loc.serviceRevenue.toFixed(2),
        loc.productRevenue.toFixed(2),
        loc.totalTransactions,
        avgTicket.toFixed(2),
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-by-location-${dateFilters.dateFrom}-to-${dateFilters.dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigate to full dashboard
  const handleViewDetails = (locationId?: string) => {
    const params = new URLSearchParams();
    if (locationId) params.set('location', locationId);
    params.set('range', dateRange);
    navigate(`/dashboard/admin/sales?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-20 mx-auto mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const displayMetrics = metrics || {
    totalRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    totalTransactions: 0,
    averageTicket: 0,
  };

  const hasNoData = !metrics || displayMetrics.totalRevenue === 0;


  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-sm tracking-wide">SALES OVERVIEW</h2>
            <p className="text-xs text-muted-foreground">
              {isAllLocations ? 'All locations combined' : selectedLocationName || 'Loading...'}
            </p>
          </div>
          {hasNoData && (
            <Badge variant="outline" className="text-muted-foreground">
              NA
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterContext && (
            <AnalyticsFilterBadge 
              locationId={filterContext.locationId} 
              dateRange={filterContext.dateRange as any} 
            />
          )}
          <LastSyncIndicator syncType="sales" showAutoRefresh />
          {!hideInternalFilter && (
            <Select value={dateRange} onValueChange={(v: DateRange) => setInternalDateRange(v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="mtd">Month To Date</SelectItem>
                <SelectItem value="ytd">Year To Date</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="last365">Last 365 Days</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" className="h-8" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-primary/10"
                onClick={() => handleViewDetails()}
              >
                <Info className="w-4 h-4 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              View full analytics
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* KPIs with Trends */}
        <div className="lg:col-span-2">
          {/* Hero: Total Revenue with Breakdown */}
          <div className="bg-muted/30 dark:bg-card rounded-xl p-4 sm:p-6 border border-border/40">
            {/* Total Revenue - Hero */}
            <div className="text-center mb-4 sm:mb-6">
              <AnimatedBlurredAmount
                value={displayMetrics.totalRevenue}
                prefix="$"
                className="text-3xl sm:text-4xl md:text-5xl font-display tabular-nums"
              />
              <div className="flex items-center gap-1 justify-center mt-2">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <MetricInfoTooltip description="Sum of all service and product sales. Tips are excluded." />
              </div>
              {(dateRange === 'today' || dateRange === 'todayToEom') && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Badge variant="outline" className="text-xs font-normal bg-warning/10 text-warning border-warning/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Expected Revenue
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                      Based on scheduled appointments. Final revenue may differ as appointments are completed, cancelled, or added.
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              {/* Actual vs Expected Revenue - Today only */}
              {dateRange === 'today' && (
                <div className="mt-4 mx-auto max-w-sm space-y-3">
                  {todayActual?.hasActualData ? (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Actual Revenue</span>
                          <BlurredAmount>
                            <span className="font-medium">
                              ${todayActual.actualRevenue.toLocaleString()} of ${displayMetrics.totalRevenue.toLocaleString()} expected
                            </span>
                          </BlurredAmount>
                        </div>
                        <Progress 
                          value={displayMetrics.totalRevenue > 0 
                            ? Math.min((todayActual.actualRevenue / displayMetrics.totalRevenue) * 100, 100) 
                            : 0
                          } 
                          className="h-1.5"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground/70 text-center">
                      Actual revenue not available until appointments check out
                    </p>
                  )}
                  {todayActual?.lastAppointmentEndTime && (
                    <p className="text-xs text-muted-foreground/70 text-center">
                      Estimated final transaction at{' '}
                      <span className="font-medium text-foreground/70">
                        {formatEndTime(todayActual.lastAppointmentEndTime)}
                      </span>
                    </p>
                  )}
                </div>
              )}
              {showTrendIndicators && (
                <div className="mt-2">
                  <SalesTrendIndicator 
                    current={comparison.current.totalRevenue}
                    previous={comparison.previous.totalRevenue} 
                  />
                </div>
              )}
            </div>
            
            {/* Services & Products Sub-cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* Services */}
              <div 
                className="text-center p-3 sm:p-4 bg-background/50 dark:bg-muted/20 rounded-lg border border-border/30 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-border/60"
                onClick={() => setDrilldownMode('services')}
              >
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Scissors className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Services</span>
                  <MetricInfoTooltip description="Revenue from booked services. Tips are tracked separately." />
                </div>
                <AnimatedBlurredAmount 
                  value={displayMetrics.serviceRevenue}
                  prefix="$"
                  className="text-xl sm:text-2xl font-display tabular-nums"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">{servicePercent}%</p>
              </div>
              
              {/* Products */}
              <div 
                className="text-center p-3 sm:p-4 bg-background/50 dark:bg-muted/20 rounded-lg border border-border/30 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-border/60"
                onClick={() => setDrilldownMode('products')}
              >
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Products</span>
                </div>
                <AnimatedBlurredAmount 
                  value={displayMetrics.productRevenue}
                  prefix="$"
                  className="text-xl sm:text-2xl font-display tabular-nums"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">{productPercent}%</p>
              </div>
            </div>
          </div>
          
          {/* Secondary KPIs Row */}
          {(() => {
            const showDailyAvg = dateRange !== 'today' && dateRange !== 'yesterday';
            const workingDays = metrics?.daysWithSales ?? 0;
            const dailyAverage = workingDays > 0 ? displayMetrics.totalRevenue / workingDays : 0;

            return (
              <div className={`grid ${showDailyAvg ? 'grid-cols-5' : 'grid-cols-4'} gap-6 mt-6`}>
                {/* Transactions */}
                <div 
                  className={cn(
                    "text-center p-3 sm:p-4 bg-muted/30 dark:bg-card rounded-lg border transition-all cursor-pointer group",
                    activeDrilldown === 'transactions'
                      ? "border-primary/50 ring-1 ring-primary/20"
                      : "border-border/30 hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => toggleDrilldown('transactions')}
                >
                  <div className="flex justify-center mb-2">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <AnimatedBlurredAmount 
                    value={displayMetrics.totalTransactions}
                    className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
                  />
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform duration-200",
                      activeDrilldown === 'transactions' && "rotate-180"
                    )} />
                    <MetricInfoTooltip description="Total number of completed sales transactions. Click for hourly breakdown." />
                  </div>
                </div>
                
                {/* Avg Ticket */}
                <div 
                  className={cn(
                    "text-center p-3 sm:p-4 bg-muted/30 dark:bg-card rounded-lg border transition-all cursor-pointer group",
                    activeDrilldown === 'avgTicket'
                      ? "border-primary/50 ring-1 ring-primary/20"
                      : "border-border/30 hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => toggleDrilldown('avgTicket')}
                >
                  <div className="flex justify-center mb-2">
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <AnimatedBlurredAmount 
                    value={Math.round(displayMetrics.averageTicket)}
                    prefix="$"
                    className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
                  />
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <p className="text-xs text-muted-foreground">Avg Ticket</p>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform duration-200",
                      activeDrilldown === 'avgTicket' && "rotate-180"
                    )} />
                    <MetricInfoTooltip description="Total Revenue (excluding tips) ÷ Transactions. Click for distribution." />
                  </div>
                </div>
                
                {/* Rev/Hour */}
                <div 
                  className={cn(
                    "text-center p-3 sm:p-4 bg-muted/30 dark:bg-card rounded-lg border transition-all cursor-pointer group",
                    activeDrilldown === 'revPerHour'
                      ? "border-primary/50 ring-1 ring-primary/20"
                      : "border-border/30 hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => toggleDrilldown('revPerHour')}
                >
                  <div className="flex justify-center mb-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <AnimatedBlurredAmount 
                    value={Math.round(revenuePerHour)}
                    prefix="$"
                    className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
                  />
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <p className="text-xs text-muted-foreground">Rev/Hour</p>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform duration-200",
                      activeDrilldown === 'revPerHour' && "rotate-180"
                    )} />
                    <MetricInfoTooltip description="Total Revenue (excluding tips) ÷ Service Hours. Click for stylist breakdown." />
                  </div>
                </div>

                {/* Daily Avg - only for multi-day ranges */}
                {showDailyAvg && (
                  <div className="text-center p-3 sm:p-4 bg-muted/30 dark:bg-card rounded-lg border border-border/30">
                    <div className="flex justify-center mb-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <AnimatedBlurredAmount 
                      value={Math.round(dailyAverage)}
                      prefix="$"
                      className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
                    />
                    <div className="flex items-center gap-1 justify-center mt-1">
                      <p className="text-xs text-muted-foreground">Daily Avg</p>
                      <MetricInfoTooltip description="Average daily revenue across days with recorded sales." />
                    </div>
                  </div>
                )}

                {/* Tips - Clickable for drill-down */}
                <div 
                  className={cn(
                    "text-center p-3 sm:p-4 bg-muted/30 dark:bg-card rounded-lg border transition-all cursor-pointer group",
                    tipsDrilldownOpen 
                      ? "border-primary/50 ring-1 ring-primary/20" 
                      : "border-border/30 hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={handleTipsToggle}
                >
                  <div className="flex justify-center mb-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <AnimatedBlurredAmount 
                    value={metrics?.totalTips ?? 0}
                    prefix="$"
                    className="text-lg sm:text-xl md:text-2xl font-display tabular-nums"
                  />
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <p className="text-xs text-muted-foreground">Tips</p>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform duration-200",
                      tipsDrilldownOpen && "rotate-180"
                    )} />
                    <MetricInfoTooltip description="Total tips collected from completed appointments. Click for stylist breakdown." />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tips Drill-Down Panel */}
          <TipsDrilldownPanel
            isOpen={tipsDrilldownOpen}
            parentLocationId={filterContext?.locationId}
          />

          {/* Transactions by Hour Drill-Down */}
          <TransactionsByHourPanel
            isOpen={activeDrilldown === 'transactions'}
            dateFrom={dateFilters.dateFrom}
            dateTo={dateFilters.dateTo}
            locationId={filterContext?.locationId}
          />

          {/* Ticket Distribution Drill-Down */}
          <TicketDistributionPanel
            isOpen={activeDrilldown === 'avgTicket'}
            dateFrom={dateFilters.dateFrom}
            dateTo={dateFilters.dateTo}
            locationId={filterContext?.locationId}
          />

          {/* Rev/Hour by Stylist Drill-Down */}
          <RevPerHourByStylistPanel
            isOpen={activeDrilldown === 'revPerHour'}
            stylistData={stylistData}
            totalServiceHours={metrics?.totalServiceHours || 0}
            isLoading={stylistLoading}
          />

          {/* Goal Progress */}
          <div className="mt-6">
           {(() => {
              const selectedLoc = !isAllLocations
                ? locations?.find(loc => loc.id === filterContext?.locationId)
                : null;
              const goalPeriod = dateRange === 'thisWeek' || dateRange === '7d' ? 'weekly' : 'monthly';
              return (
                <GoalProgressWithOwnRevenue
                  goalPeriod={goalPeriod}
                  locationId={filterContext?.locationId}
                  target={currentGoal}
                  label={goalLabel}
                  hoursJson={selectedLoc?.hours_json}
                  holidayClosures={selectedLoc?.holiday_closures}
                />
              );
            })()}
          </div>
        </div>

        {/* Sidebar - Top Performers & Donut */}
        <div className="flex flex-col gap-6 min-w-0">
          <div className="flex-1">
            <TopPerformersCard 
              performers={stylistData || []} 
              isLoading={stylistLoading}
              showInfoTooltip
            />
          </div>
          <RevenueDonutChart
            serviceRevenue={displayMetrics.serviceRevenue} 
            productRevenue={displayMetrics.productRevenue}
            size={64}
          />
        </div>
      </div>

      {/* By Location - Expandable Rows */}
      {isAllLocations && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-display text-xs tracking-wide text-muted-foreground">BY LOCATION</h3>
            </div>
            <div className="flex items-center gap-2">
              {availableRegions.length >= 2 && (
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[140px] h-7 text-xs">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {availableRegions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={locationSortField} onValueChange={(v) => handleLocationSort(v as LocationSortField)}>
                <SelectTrigger className="w-[130px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalRevenue">Revenue</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="serviceRevenue">Services</SelectItem>
                  <SelectItem value="productRevenue">Products</SelectItem>
                  <SelectItem value="totalTransactions">Transactions</SelectItem>
                  <SelectItem value="avgTicket">Avg Ticket</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setLocationSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {locationSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          
          {filteredLocationData && filteredLocationData.length > 0 ? (
            <>
              <div className="rounded-lg border border-border/50 divide-y divide-border/50 overflow-hidden">
                {visibleLocationData.map((location, idx) => {
                  const avgTicket = location.totalTransactions > 0 
                    ? location.totalRevenue / location.totalTransactions 
                    : 0;
                  const isExpanded = expandedLocationId === (location.location_id || String(idx));
                  const locKey = location.location_id || String(idx);
                  
                  return (
                    <div key={locKey}>
                      {/* Collapsed row */}
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setExpandedLocationId(isExpanded ? null : locKey)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{location.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-display tabular-nums">
                            <BlurredAmount>${location.totalRevenue.toLocaleString()}</BlurredAmount>
                          </span>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* Services */}
                                <div className="bg-muted/30 rounded-lg border border-border/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Services</p>
                                  <p className="text-sm font-display tabular-nums">
                                    <BlurredAmount>${location.serviceRevenue.toLocaleString()}</BlurredAmount>
                                  </p>
                                </div>
                                {/* Products */}
                                <div className="bg-muted/30 rounded-lg border border-border/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Products</p>
                                  <p className="text-sm font-display tabular-nums">
                                    <BlurredAmount>${location.productRevenue.toLocaleString()}</BlurredAmount>
                                  </p>
                                </div>
                                {/* Transactions */}
                                <div className="bg-muted/30 rounded-lg border border-border/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                                  <p className="text-sm font-display tabular-nums">
                                    <BlurredAmount>{location.totalTransactions}</BlurredAmount>
                                  </p>
                                </div>
                                {/* Avg Ticket */}
                                <div className="bg-muted/30 rounded-lg border border-border/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Avg Ticket</p>
                                  <p className="text-sm font-display tabular-nums">
                                    <BlurredAmount>${isFinite(avgTicket) ? Math.round(avgTicket) : 0}</BlurredAmount>
                                  </p>
                                </div>
                                {/* Trend */}
                                <div className="bg-muted/30 rounded-lg border border-border/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Trend</p>
                                  {!hideNumbers ? (
                                    <TrendSparkline 
                                      data={getLocationTrend(location.location_id).map(d => d.value)} 
                                      width={80}
                                      height={24}
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </div>
                                {/* Status (Today only) */}
                                {isToday && (
                                  <div className="bg-muted/30 rounded-lg border border-border/30 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    {(() => {
                                      const locActual = locationActuals[location.location_id || ''];
                                      const expectedRevenue = location.totalRevenue;
                                      if (!locActual || !locActual.hasActualData) {
                                        return <span className="text-xs text-muted-foreground/70">Pending</span>;
                                      }
                                      if (locActual.actualRevenue >= expectedRevenue && expectedRevenue > 0) {
                                        return (
                                          <div className="space-y-0.5">
                                            <Badge variant="outline" className="text-[10px] font-normal bg-primary/10 text-primary border-primary/30">
                                              <Check className="w-3 h-3 mr-1" />
                                              Checked out
                                            </Badge>
                                            {locActual.lastEndTime && (
                                              <p className="text-[10px] text-muted-foreground/60">
                                                Last: {formatEndTime(locActual.lastEndTime)}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="space-y-0.5">
                                          <BlurredAmount>
                                            <span className="text-xs text-muted-foreground">
                                              ${locActual.actualRevenue.toLocaleString()} / ${expectedRevenue.toLocaleString()}
                                            </span>
                                          </BlurredAmount>
                                          {locActual.lastEndTime && (
                                            <p className="text-[10px] text-muted-foreground/60">
                                              Last: {formatEndTime(locActual.lastEndTime)}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                              {/* View details link */}
                              <button
                                className="mt-3 text-xs text-primary hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(location.location_id);
                                }}
                              >
                                View full details →
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
              {filteredLocationData.length > COLLAPSED_COUNT && (
                <div className="flex justify-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setLocationsExpanded(prev => !prev)}
                  >
                    {locationsExpanded 
                      ? 'Show less' 
                      : `Show all ${filteredLocationData.length} locations`
                    }
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No location data available</p>
              <p className="text-xs mt-1">Sync sales to see breakdown by location</p>
            </div>
          )}
        </div>
      )}
      {/* Service/Product Drilldown Dialog */}
      <ServiceProductDrilldown
        mode={drilldownMode}
        onClose={() => setDrilldownMode(null)}
        dateFrom={dateFilters.dateFrom}
        dateTo={dateFilters.dateTo}
        parentLocationId={filterContext?.locationId}
      />
    </Card>
  );
}
