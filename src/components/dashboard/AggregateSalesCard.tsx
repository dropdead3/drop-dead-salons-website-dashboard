import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlurredAmount, useHideNumbers } from '@/contexts/HideNumbersContext';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Scissors, 
  ShoppingBag, 
  TrendingUp, 
  Receipt,
  CreditCard,
  MapPin,
  Building2,
  Download,
  Info,
  ChevronRight,
  CalendarClock,
  Clock,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';
import { useSalesMetrics, useSalesByStylist, useSalesByLocation, useSalesTrend } from '@/hooks/useSalesData';
import { useTomorrowRevenue } from '@/hooks/useTomorrowRevenue';
import { useSalesComparison } from '@/hooks/useSalesComparison';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

// Sub-components
import { SalesTrendIndicator } from './sales/SalesTrendIndicator';
import { TrendSparkline } from './TrendSparkline';
import { TopPerformersCard } from './sales/TopPerformersCard';
import { RevenueDonutChart } from './sales/RevenueDonutChart';
import { SalesGoalProgress } from './sales/SalesGoalProgress';
import { LastSyncIndicator } from './sales/LastSyncIndicator';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'mtd' | 'ytd' | 'lastYear' | 'last365';

export function AggregateSalesCard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const { hideNumbers } = useHideNumbers();

  const dateFilters = (() => {
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

  const isLoading = metricsLoading || locationLoading;

  // Calculate revenue per hour
  const revenuePerHour = (() => {
    const serviceHours = metrics?.totalServiceHours || 0;
    if (serviceHours === 0) return 0;
    return (metrics?.totalRevenue || 0) / serviceHours;
  })();

  // Calculate goal based on date range
  const currentGoal = (() => {
    switch (dateRange) {
      case 'mtd':
      case '30d':
        return goals?.monthlyTarget || 50000;
      case 'ytd':
      case 'lastYear':
      case 'last365':
        return (goals?.monthlyTarget || 50000) * 12; // Yearly goal
      default:
        return goals?.weeklyTarget || 12500;
    }
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
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-display text-sm tracking-wide">SALES OVERVIEW</h2>
              <p className="text-xs text-muted-foreground">All locations combined</p>
            </div>
            <CommandCenterVisibilityToggle 
              elementKey="sales_overview" 
              elementName="Sales Overview" 
            />
          </div>
          {hasNoData && (
            <Badge variant="outline" className="text-muted-foreground">
              NA
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LastSyncIndicator syncType="sales" showAutoRefresh />
          <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
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
      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        {/* KPIs with Trends */}
        <div className="lg:col-span-3">
          <div className="grid gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3">
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <AnimatedBlurredAmount 
                value={displayMetrics.totalRevenue}
                prefix="$"
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1 mb-1">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <MetricInfoTooltip description="Sum of all service and product sales for the selected date range, synced from Phorest daily summaries." />
              </div>
              {showTrendIndicators && (
                <SalesTrendIndicator 
                  current={comparison.current.totalRevenue}
                  previous={comparison.previous.totalRevenue} 
                />
              )}
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <AnimatedBlurredAmount 
                value={displayMetrics.serviceRevenue}
                prefix="$"
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1 mb-1">
                <p className="text-xs text-muted-foreground">Services</p>
                <MetricInfoTooltip description="Revenue from all service transactions (cuts, color, treatments, etc.) excluding retail products." />
              </div>
              {showTrendIndicators && (
                <SalesTrendIndicator 
                  current={comparison.current.serviceRevenue} 
                  previous={comparison.previous.serviceRevenue} 
                />
              )}
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-chart-2" />
              </div>
              <AnimatedBlurredAmount 
                value={displayMetrics.productRevenue}
                prefix="$"
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1 mb-1">
                <p className="text-xs text-muted-foreground">Products</p>
                <MetricInfoTooltip description="Revenue from retail product sales only, excluding service charges." />
              </div>
              {showTrendIndicators && (
                <SalesTrendIndicator 
                  current={comparison.current.productRevenue} 
                  previous={comparison.previous.productRevenue} 
                />
              )}
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3" />
              </div>
              <AnimatedBlurredAmount 
                value={displayMetrics.totalTransactions}
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1 mb-1">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <MetricInfoTooltip description="Total number of completed sales transactions. One client visit = one transaction." />
              </div>
              {showTrendIndicators && (
                <SalesTrendIndicator 
                  current={comparison.current.totalTransactions} 
                  previous={comparison.previous.totalTransactions} 
                />
              )}
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-chart-4" />
              </div>
              <AnimatedBlurredAmount 
                value={isFinite(displayMetrics.averageTicket) ? Math.round(displayMetrics.averageTicket) : 0}
                prefix="$"
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1 mb-1">
                <p className="text-xs text-muted-foreground">Avg Ticket</p>
                <MetricInfoTooltip description="Total Revenue ÷ Transactions. Average spend per client visit." />
              </div>
              {showTrendIndicators && (
                <SalesTrendIndicator 
                  current={comparison.current.averageTicket} 
                  previous={comparison.previous.averageTicket} 
                />
              )}
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-chart-5" />
              </div>
              <AnimatedBlurredAmount 
                value={tomorrowData?.revenue || 0}
                prefix="$"
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1">
                <p className="text-xs text-muted-foreground">Rev. Tomorrow</p>
                <MetricInfoTooltip description="Projected revenue from confirmed and booked appointments scheduled for tomorrow." />
              </div>
              <span className="text-xs text-muted-foreground/70">
                {tomorrowData?.appointmentCount || 0} bookings
              </span>
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
              <div className="flex justify-center mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-chart-1" />
              </div>
              <AnimatedBlurredAmount 
                value={Math.round(revenuePerHour)}
                prefix="$"
                className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
              />
              <div className="flex items-center gap-1 justify-center mt-1">
                <p className="text-xs text-muted-foreground">Rev/Hour</p>
                <MetricInfoTooltip description="Total Revenue ÷ Service Hours. Average revenue per hour of stylist work." />
              </div>
            </div>
          </div>

          {/* Goal Progress */}
          <div className="mt-4">
            <SalesGoalProgress 
              current={displayMetrics.totalRevenue} 
              target={currentGoal}
              label={goalLabel}
            />
          </div>
        </div>

        {/* Sidebar - Top Performers & Donut */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="font-display text-xs tracking-wide text-muted-foreground">TOP PERFORMERS</h3>
              <MetricInfoTooltip description="Ranked by total service + product revenue for the selected period." />
            </div>
            <TopPerformersCard 
              performers={stylistData || []} 
              isLoading={stylistLoading} 
            />
          </div>
          <div>
            <h3 className="font-display text-xs tracking-wide text-muted-foreground mb-3">REVENUE MIX</h3>
            <RevenueDonutChart 
              serviceRevenue={displayMetrics.serviceRevenue} 
              productRevenue={displayMetrics.productRevenue}
              size={70}
            />
          </div>
        </div>
      </div>

      {/* By Location Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-xs tracking-wide text-muted-foreground">BY LOCATION</h3>
        </div>
        
        {locationData && locationData.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-display text-xs">Location</TableHead>
                  <TableHead className="font-display text-xs text-center">Revenue</TableHead>
                  <TableHead className="font-display text-xs text-center hidden md:table-cell w-[120px]">Trend</TableHead>
                  <TableHead className="font-display text-xs text-center hidden sm:table-cell">Services</TableHead>
                  <TableHead className="font-display text-xs text-center hidden sm:table-cell">Products</TableHead>
                  <TableHead className="font-display text-xs text-center hidden md:table-cell">Transactions</TableHead>
                  <TableHead className="font-display text-xs text-center">Avg Ticket</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationData.map((location, idx) => {
                  const avgTicket = location.totalTransactions > 0 
                    ? location.totalRevenue / location.totalTransactions 
                    : 0;
                  return (
                    <TableRow 
                      key={location.location_id || idx}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewDetails(location.location_id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-display">
                        <BlurredAmount>${location.totalRevenue.toLocaleString()}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        {!hideNumbers && (
                          <TrendSparkline 
                            data={getLocationTrend(location.location_id).map(d => d.value)} 
                            width={100}
                            height={24}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <BlurredAmount>${location.serviceRevenue.toLocaleString()}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <BlurredAmount>${location.productRevenue.toLocaleString()}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <BlurredAmount>{location.totalTransactions}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-center font-display">
                        <BlurredAmount>${isFinite(avgTicket) ? Math.round(avgTicket) : 0}</BlurredAmount>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
            <p className="text-xs mt-1">Sync sales to see breakdown by location</p>
          </div>
        )}
      </div>
    </Card>
  );
}
