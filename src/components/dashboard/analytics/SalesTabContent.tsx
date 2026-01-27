import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Scissors,
  RefreshCw,
  Loader2,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { useSalesMetrics, useSalesTrend, useSalesByStylist, useSalesByLocation } from '@/hooks/useSalesData';
import { useTriggerPhorestSync } from '@/hooks/usePhorestSync';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useLocations } from '@/hooks/useLocations';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

// Sub-components
import { SalesGoalsDialog } from '@/components/dashboard/sales/SalesGoalsDialog';
import { SalesGoalProgress } from '@/components/dashboard/sales/SalesGoalProgress';
import { LocationComparison } from '@/components/dashboard/sales/LocationComparison';
import { HistoricalComparison } from '@/components/dashboard/sales/HistoricalComparison';
import { StylistSalesRow } from '@/components/dashboard/sales/StylistSalesRow';
import { LastSyncIndicator } from '@/components/dashboard/sales/LastSyncIndicator';
import { ProductCategoryChart } from '@/components/dashboard/sales/ProductCategoryChart';
import { ServicePopularityChart } from '@/components/dashboard/sales/ServicePopularityChart';
import { ClientFunnelCard } from '@/components/dashboard/sales/ClientFunnelCard';
import { PeakHoursHeatmap } from '@/components/dashboard/sales/PeakHoursHeatmap';
import { CommissionCalculator } from '@/components/dashboard/sales/CommissionCalculator';
import { SalesReportPDF } from '@/components/dashboard/sales/SalesReportPDF';
import { CommissionTiersEditor } from '@/components/dashboard/sales/CommissionTiersEditor';
import { TeamGoalsCard } from '@/components/dashboard/sales/TeamGoalsCard';
import { RevenueForecast } from '@/components/dashboard/sales/RevenueForecast';
import { YearOverYearComparison } from '@/components/dashboard/sales/YearOverYearComparison';
import { GoogleSheetsExport } from '@/components/dashboard/sales/GoogleSheetsExport';
import type { AnalyticsFilters } from '@/pages/dashboard/admin/AnalyticsHub';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface SalesTabContentProps {
  filters: AnalyticsFilters;
  subTab?: string;
  onSubTabChange: (value: string) => void;
}

export function SalesTabContent({ filters, subTab = 'overview', onSubTabChange }: SalesTabContentProps) {
  const { data: locations } = useLocations();
  const syncSales = useTriggerPhorestSync();
  const { goals } = useSalesGoals();

  const locationFilter = filters.locationId !== 'all' ? filters.locationId : undefined;

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    locationId: locationFilter,
  });
  
  const { data: trendData, isLoading: trendLoading } = useSalesTrend(
    filters.dateFrom, 
    filters.dateTo,
    locationFilter
  );
  
  const { data: stylistData, isLoading: stylistLoading } = useSalesByStylist(filters.dateFrom, filters.dateTo);
  const { data: locationData, isLoading: locationLoading } = useSalesByLocation(filters.dateFrom, filters.dateTo);

  // Calculate goal based on date range
  const currentGoal = useMemo(() => {
    const isMonthly = filters.dateRange === 'thisMonth' || filters.dateRange === '30d' || filters.dateRange === 'lastMonth';
    if (filters.locationId !== 'all' && goals?.locationTargets?.[filters.locationId]) {
      return isMonthly 
        ? goals.locationTargets[filters.locationId].monthly 
        : goals.locationTargets[filters.locationId].weekly;
    }
    return isMonthly ? (goals?.monthlyTarget || 50000) : (goals?.weeklyTarget || 12500);
  }, [filters.dateRange, filters.locationId, goals]);

  // Format trend data for chart
  const chartData = useMemo(() => {
    const data = trendData?.overall || trendData || [];
    return (Array.isArray(data) ? data : []).map((d: any) => ({
      ...d,
      dateLabel: format(new Date(d.date), 'MMM d'),
    }));
  }, [trendData]);

  // Pie chart data for revenue breakdown
  const revenueBreakdown = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Services', value: metrics.serviceRevenue, color: CHART_COLORS[0] },
      { name: 'Products', value: metrics.productRevenue, color: CHART_COLORS[1] },
    ].filter(d => d.value > 0);
  }, [metrics]);

  const maxStylistRevenue = useMemo(() => {
    return Math.max(...(stylistData || []).map(s => s.totalRevenue), 1);
  }, [stylistData]);

  const handleExportCSV = () => {
    if (!stylistData) return;
    
    const headers = ['Stylist', 'Total Revenue', 'Service Revenue', 'Product Revenue', 'Services', 'Products', 'Transactions'];
    const rows = stylistData.map(s => [
      s.name,
      s.totalRevenue.toFixed(2),
      s.serviceRevenue.toFixed(2),
      s.productRevenue.toFixed(2),
      s.totalServices,
      s.totalProducts,
      s.totalTransactions,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${filters.dateFrom}-to-${filters.dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CommandCenterVisibilityToggle 
            elementKey="week_ahead_forecast" 
            elementName="Forecasting" 
          />
          <LastSyncIndicator syncType="sales" showAutoRefresh />
        </div>
        <div className="flex items-center gap-2">
          <SalesGoalsDialog />
          <Button
            variant="outline"
            size="icon"
            onClick={() => syncSales.mutate('sales')}
            disabled={syncSales.isPending}
          >
            {syncSales.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
          </Button>
          <GoogleSheetsExport 
            data={{
              stylistData,
              locationData,
              dailyData: chartData,
              metrics,
            }}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
          />
          <SalesReportPDF
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            metrics={metrics}
            stylistData={stylistData}
            locationData={locationData}
          />
        </div>
      </div>

      {/* Goal Progress */}
      <SalesGoalProgress 
        current={metrics?.totalRevenue || 0} 
        target={currentGoal}
        label={
          filters.locationId !== 'all' 
            ? `${locations?.find(l => l.id === filters.locationId)?.name} Goal`
            : filters.dateRange === 'thisMonth' || filters.dateRange === '30d' || filters.dateRange === 'lastMonth'
              ? 'Monthly Goal'
              : 'Weekly Goal'
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-display truncate">
                  {metricsLoading ? '...' : `$${(metrics?.totalRevenue || 0).toLocaleString()}`}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-chart-2" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-display">
                  {metricsLoading ? '...' : `$${Math.round(metrics?.averageTicket || 0)}`}
                </p>
                <p className="text-xs text-muted-foreground">Avg Ticket</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 md:w-5 md:h-5 text-chart-3" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-display">
                  {metricsLoading ? '...' : (metrics?.totalServices || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-chart-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-display">
                  {metricsLoading ? '...' : (metrics?.totalProducts || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs for detailed views */}
      <Tabs value={subTab} onValueChange={onSubTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {trendLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="dateLabel" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalRevenue" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown and Location Comparison */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Revenue Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <LocationComparison 
              locations={locationData || []} 
              isLoading={locationLoading} 
            />
          </div>

          {/* Product and Service Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ProductCategoryChart dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
            <ServicePopularityChart dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6 space-y-6">
          <TeamGoalsCard currentRevenue={metrics?.totalRevenue || 0} />
          <YearOverYearComparison locationId={locationFilter} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6 space-y-6">
          {/* Stylist Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Staff Performance</CardTitle>
              <CardDescription>Revenue by team member</CardDescription>
            </CardHeader>
            <CardContent>
              {stylistLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {stylistData?.slice(0, 10).map((stylist, index) => (
                    <StylistSalesRow
                      key={stylist.staffId}
                      stylist={stylist}
                      rank={index + 1}
                      maxRevenue={maxStylistRevenue}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <PeakHoursHeatmap dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
            <ClientFunnelCard dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="mt-6 space-y-6">
          <RevenueForecast 
            dailyData={chartData.map(d => ({ date: d.dateLabel, revenue: d.totalRevenue || 0 }))} 
            monthlyTarget={goals?.monthlyTarget || 50000} 
            isLoading={trendLoading}
          />
          <HistoricalComparison 
            currentDateFrom={filters.dateFrom} 
            currentDateTo={filters.dateTo} 
            locationId={locationFilter}
          />
        </TabsContent>

        <TabsContent value="commission" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <CommissionCalculator 
              serviceRevenue={metrics?.serviceRevenue || 0}
              productRevenue={metrics?.productRevenue || 0}
            />
            <CommissionTiersEditor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
