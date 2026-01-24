import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlurredAmount, useHideNumbers } from '@/contexts/HideNumbersContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Scissors, 
  ShoppingBag, 
  TrendingUp, 
  Receipt,
  MapPin,
  Building2,
  Download,
  ChevronRight,
} from 'lucide-react';
import { useSalesMetrics, useSalesByStylist, useSalesByLocation, useSalesTrend } from '@/hooks/useSalesData';
import { useSalesComparison } from '@/hooks/useSalesComparison';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
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

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'thisMonth';

export function AggregateSalesCard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('7d');
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
      case 'thisMonth':
        return { 
          dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'), 
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
  const { goals } = useSalesGoals();

  const isLoading = metricsLoading || locationLoading;

  // Calculate goal based on date range
  const currentGoal = dateRange === 'thisMonth' || dateRange === '30d' 
    ? (goals?.monthlyTarget || 50000)
    : (goals?.weeklyTarget || 12500);

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
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {[...Array(5)].map((_, i) => (
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
          <div>
            <h2 className="font-display text-sm tracking-wide">SALES OVERVIEW</h2>
            <p className="text-xs text-muted-foreground">All locations combined</p>
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
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => handleViewDetails()}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        {/* KPIs with Trends */}
        <div className="lg:col-span-3">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <BlurredAmount className="text-2xl font-display">
                  ${displayMetrics.totalRevenue.toLocaleString()}
                </BlurredAmount>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              {comparison && (
                <SalesTrendIndicator 
                  current={comparison.current.totalRevenue}
                  previous={comparison.previous.totalRevenue} 
                />
              )}
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Scissors className="w-4 h-4 text-primary" />
                <BlurredAmount className="text-2xl font-display">
                  ${displayMetrics.serviceRevenue.toLocaleString()}
                </BlurredAmount>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Services</p>
              {comparison && (
                <SalesTrendIndicator 
                  current={comparison.current.serviceRevenue} 
                  previous={comparison.previous.serviceRevenue} 
                />
              )}
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShoppingBag className="w-4 h-4 text-chart-2" />
                <BlurredAmount className="text-2xl font-display">
                  ${displayMetrics.productRevenue.toLocaleString()}
                </BlurredAmount>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Products</p>
              {comparison && (
                <SalesTrendIndicator 
                  current={comparison.current.productRevenue} 
                  previous={comparison.previous.productRevenue} 
                />
              )}
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Receipt className="w-4 h-4 text-chart-3" />
                <BlurredAmount className="text-2xl font-display">
                  {displayMetrics.totalTransactions}
                </BlurredAmount>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              {comparison && (
                <SalesTrendIndicator 
                  current={comparison.current.totalTransactions} 
                  previous={comparison.previous.totalTransactions} 
                />
              )}
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-chart-4" />
                <BlurredAmount className="text-2xl font-display">
                  ${isFinite(displayMetrics.averageTicket) ? Math.round(displayMetrics.averageTicket) : 0}
                </BlurredAmount>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Avg Ticket</p>
              {comparison && (
                <SalesTrendIndicator 
                  current={comparison.current.averageTicket} 
                  previous={comparison.previous.averageTicket} 
                />
              )}
            </div>
          </div>

          {/* Goal Progress */}
          <div className="mt-4">
            <SalesGoalProgress 
              current={displayMetrics.totalRevenue} 
              target={currentGoal}
              label={dateRange === 'thisMonth' || dateRange === '30d' ? 'Monthly Goal' : 'Weekly Goal'}
            />
          </div>
        </div>

        {/* Sidebar - Top Performers & Donut */}
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xs tracking-wide text-muted-foreground mb-3">TOP PERFORMERS</h3>
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
                  <TableHead className="font-display text-xs text-right">Revenue</TableHead>
                  <TableHead className="font-display text-xs hidden md:table-cell w-[120px]">Trend</TableHead>
                  <TableHead className="font-display text-xs text-right hidden sm:table-cell">Services</TableHead>
                  <TableHead className="font-display text-xs text-right hidden sm:table-cell">Products</TableHead>
                  <TableHead className="font-display text-xs text-right hidden md:table-cell">Transactions</TableHead>
                  <TableHead className="font-display text-xs text-right">Avg Ticket</TableHead>
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
                      <TableCell className="text-right font-display">
                        <BlurredAmount>${location.totalRevenue.toLocaleString()}</BlurredAmount>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {!hideNumbers && (
                          <TrendSparkline 
                            data={getLocationTrend(location.location_id).map(d => d.value)} 
                            width={100}
                            height={24}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <BlurredAmount>${location.serviceRevenue.toLocaleString()}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <BlurredAmount>${location.productRevenue.toLocaleString()}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <BlurredAmount>{location.totalTransactions}</BlurredAmount>
                      </TableCell>
                      <TableCell className="text-right font-display">
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
