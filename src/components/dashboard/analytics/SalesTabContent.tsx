import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, SubTabsList, SubTabsTrigger } from '@/components/ui/tabs';
import { VisibilityGate } from '@/components/visibility/VisibilityGate';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  Scissors,
  RefreshCw,
  Loader2,
  Download,
  CreditCard,
  Receipt,
  CalendarClock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useSalesMetrics, useSalesTrend, useSalesByStylist, useSalesByLocation } from '@/hooks/useSalesData';
import { useTriggerPhorestSync } from '@/hooks/usePhorestSync';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useLocations } from '@/hooks/useLocations';
import { useTomorrowRevenue } from '@/hooks/useTomorrowRevenue';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { AnimatedBlurredAmount } from '@/components/ui/AnimatedBlurredAmount';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';

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
import { ForecastingCard } from '@/components/dashboard/sales/ForecastingCard';
import { YearOverYearComparison } from '@/components/dashboard/sales/YearOverYearComparison';
import { GoogleSheetsExport } from '@/components/dashboard/sales/GoogleSheetsExport';
import { SalesBentoCard } from '@/components/dashboard/sales/SalesBentoCard';
import type { AnalyticsFilters } from '@/pages/dashboard/admin/AnalyticsHub';

interface SalesTabContentProps {
  filters: AnalyticsFilters;
  subTab?: string;
  onSubTabChange: (value: string) => void;
}

export function SalesTabContent({ filters, subTab = 'overview', onSubTabChange }: SalesTabContentProps) {
  const { data: locations } = useLocations();
  const syncSales = useTriggerPhorestSync();
  const { goals } = useSalesGoals();
  const { data: tomorrowData } = useTomorrowRevenue();

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

      {/* Unified Sales Bento Card */}
      <PinnableCard 
        elementKey="sales_dashboard_bento" 
        elementName="Sales Dashboard" 
        category="Analytics Hub - Sales"
      >
        <SalesBentoCard
          currentRevenue={metrics?.totalRevenue || 0}
          goalTarget={currentGoal}
          goalLabel={
            filters.locationId !== 'all' 
              ? `${locations?.find(l => l.id === filters.locationId)?.name} Goal`
              : filters.dateRange === 'thisMonth' || filters.dateRange === '30d' || filters.dateRange === 'lastMonth'
                ? 'Monthly Goal'
                : 'Weekly Goal'
          }
          totalRevenue={metrics?.totalRevenue || 0}
          serviceRevenue={metrics?.serviceRevenue || 0}
          productRevenue={metrics?.productRevenue || 0}
          totalTransactions={metrics?.totalTransactions || 0}
          averageTicket={metrics?.averageTicket || 0}
          tomorrowRevenue={tomorrowData?.revenue || 0}
          tomorrowBookings={tomorrowData?.appointmentCount || 0}
          performers={stylistData || []}
          isLoading={metricsLoading || stylistLoading}
        />
      </PinnableCard>

      {/* Sub-tabs for detailed views */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          View
        </span>
        <Tabs value={subTab} onValueChange={onSubTabChange}>
          <SubTabsList>
            <VisibilityGate elementKey="sales_overview_subtab" elementName="Overview" elementCategory="Page Tabs">
              <SubTabsTrigger value="overview">Overview</SubTabsTrigger>
            </VisibilityGate>
            <VisibilityGate elementKey="sales_goals_subtab" elementName="Goals" elementCategory="Page Tabs">
              <SubTabsTrigger value="goals">Goals</SubTabsTrigger>
            </VisibilityGate>
            <VisibilityGate elementKey="sales_staff_subtab" elementName="Staff Performance" elementCategory="Page Tabs">
              <SubTabsTrigger value="staff">Staff Performance</SubTabsTrigger>
            </VisibilityGate>
            <VisibilityGate elementKey="sales_forecasting_subtab" elementName="Forecasting" elementCategory="Page Tabs">
              <SubTabsTrigger value="forecasting">Forecasting</SubTabsTrigger>
            </VisibilityGate>
            <VisibilityGate elementKey="sales_commission_subtab" elementName="Commission" elementCategory="Page Tabs">
              <SubTabsTrigger value="commission">Commission</SubTabsTrigger>
            </VisibilityGate>
          </SubTabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Revenue Trend */}
          <PinnableCard elementKey="revenue_trend_chart" elementName="Revenue Trend" category="Analytics Hub - Sales">
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
          </PinnableCard>

          {/* Location Comparison */}
          <PinnableCard elementKey="location_comparison" elementName="Location Comparison" category="Analytics Hub - Sales">
            <LocationComparison 
              locations={locationData || []} 
              isLoading={locationLoading} 
            />
          </PinnableCard>

          {/* Product and Service Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PinnableCard elementKey="product_category_chart" elementName="Product Categories" category="Analytics Hub - Sales">
              <ProductCategoryChart dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
            </PinnableCard>
            <PinnableCard elementKey="service_popularity_chart" elementName="Service Popularity" category="Analytics Hub - Sales">
              <ServicePopularityChart dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
            </PinnableCard>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6 space-y-6">
          <PinnableCard elementKey="team_goals" elementName="Team Goals" category="Analytics Hub - Sales">
            <TeamGoalsCard currentRevenue={metrics?.totalRevenue || 0} />
          </PinnableCard>
          <PinnableCard elementKey="yoy_comparison" elementName="Year-over-Year" category="Analytics Hub - Sales">
            <YearOverYearComparison locationId={locationFilter} />
          </PinnableCard>
        </TabsContent>

        <TabsContent value="staff" className="mt-6 space-y-6">
          {/* Stylist Leaderboard */}
          <PinnableCard elementKey="staff_leaderboard" elementName="Staff Performance" category="Analytics Hub - Sales">
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
          </PinnableCard>

          <div className="grid lg:grid-cols-2 gap-6">
            <PinnableCard elementKey="peak_hours_heatmap" elementName="Peak Hours Heatmap" category="Analytics Hub - Sales">
              <PeakHoursHeatmap dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
            </PinnableCard>
            <PinnableCard elementKey="client_funnel" elementName="Client Funnel" category="Analytics Hub - Sales">
              <ClientFunnelCard dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
            </PinnableCard>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="mt-6 space-y-6">
          <PinnableCard elementKey="week_ahead_forecast" elementName="Forecasting" category="Analytics Hub - Sales">
            <ForecastingCard />
          </PinnableCard>
          <div className="grid lg:grid-cols-2 gap-6">
            <PinnableCard elementKey="revenue_forecast" elementName="Revenue Forecast" category="Analytics Hub - Sales">
              <RevenueForecast 
                dailyData={chartData.map(d => ({ date: d.dateLabel, revenue: d.totalRevenue || 0 }))} 
                monthlyTarget={goals?.monthlyTarget || 50000} 
                isLoading={trendLoading}
              />
            </PinnableCard>
            <PinnableCard elementKey="historical_comparison" elementName="Historical Comparison" category="Analytics Hub - Sales">
              <HistoricalComparison 
                currentDateFrom={filters.dateFrom} 
                currentDateTo={filters.dateTo} 
                locationId={locationFilter}
              />
            </PinnableCard>
          </div>
        </TabsContent>

        <TabsContent value="commission" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <PinnableCard elementKey="commission_calculator" elementName="Commission Calculator" category="Analytics Hub - Sales">
              <CommissionCalculator 
                serviceRevenue={metrics?.serviceRevenue || 0}
                productRevenue={metrics?.productRevenue || 0}
              />
            </PinnableCard>
            <PinnableCard elementKey="commission_tiers" elementName="Commission Tiers" category="Analytics Hub - Sales">
              <CommissionTiersEditor />
            </PinnableCard>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
