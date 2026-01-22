import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users,
  ShoppingBag,
  Scissors,
  Calendar,
  RefreshCw,
  Loader2,
  MapPin,
  Download,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useSalesMetrics, useSalesTrend, useSalesByStylist, useSalesByLocation } from '@/hooks/useSalesData';
import { useTriggerPhorestSync } from '@/hooks/usePhorestSync';
import { useLocations } from '@/hooks/useLocations';
import { cn } from '@/lib/utils';

type DateRange = '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';

interface Location {
  id: string;
  name: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function SalesDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  const { data: locations } = useLocations();
  const syncSales = useTriggerPhorestSync();

  // Calculate date filters
  const dateFilters = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case '30d':
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case 'thisWeek':
        return { 
          dateFrom: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), 
          dateTo: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') 
        };
      case 'thisMonth':
        return { 
          dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'), 
          dateTo: format(endOfMonth(now), 'yyyy-MM-dd') 
        };
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { 
          dateFrom: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), 
          dateTo: format(endOfMonth(lastMonth), 'yyyy-MM-dd') 
        };
      default:
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    }
  }, [dateRange]);

  const filters = {
    ...dateFilters,
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
  };

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(filters);
  const { data: trendData, isLoading: trendLoading } = useSalesTrend(
    dateFilters.dateFrom, 
    dateFilters.dateTo,
    locationFilter !== 'all' ? locationFilter : undefined
  );
  const { data: stylistData, isLoading: stylistLoading } = useSalesByStylist(dateFilters.dateFrom, dateFilters.dateTo);
  const { data: locationData, isLoading: locationLoading } = useSalesByLocation(dateFilters.dateFrom, dateFilters.dateTo);

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
    a.download = `sales-report-${dateFilters.dateFrom}-to-${dateFilters.dateTo}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display">SALES DASHBOARD</h1>
              <p className="text-muted-foreground text-sm">Revenue and transaction analytics</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[160px]">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display">
                    {metricsLoading ? '...' : `$${(metrics?.totalRevenue || 0).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-display">
                    {metricsLoading ? '...' : `$${Math.round(metrics?.averageTicket || 0)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Ticket</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-display">
                    {metricsLoading ? '...' : (metrics?.totalServices || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Services</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-display">
                    {metricsLoading ? '...' : (metrics?.totalProducts || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Products Sold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stylists">By Stylist</TabsTrigger>
            <TabsTrigger value="locations">By Location</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Revenue Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-display">Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {trendLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
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

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Revenue Breakdown</CardTitle>
                  <CardDescription>Services vs Products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {metricsLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {revenueBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Services</span>
                      <span className="font-medium">${(metrics?.serviceRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Products</span>
                      <span className="font-medium">${(metrics?.productRevenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* By Stylist Tab */}
          <TabsContent value="stylists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Sales by Stylist</CardTitle>
                <CardDescription>Top performers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {stylistLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(stylistData || []).slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={120}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-display">Stylist</th>
                            <th className="text-right py-2">Revenue</th>
                            <th className="text-right py-2">Services</th>
                            <th className="text-right py-2">Products</th>
                            <th className="text-right py-2">Avg Ticket</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stylistData || []).map(stylist => (
                            <tr key={stylist.user_id} className="border-b border-border/50">
                              <td className="py-2 font-medium">{stylist.name}</td>
                              <td className="text-right">${stylist.totalRevenue.toLocaleString()}</td>
                              <td className="text-right">{stylist.totalServices}</td>
                              <td className="text-right">{stylist.totalProducts}</td>
                              <td className="text-right">
                                ${stylist.totalTransactions > 0 
                                  ? Math.round(stylist.totalRevenue / stylist.totalTransactions)
                                  : 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Location Tab */}
          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Sales by Location</CardTitle>
                <CardDescription>Performance by branch</CardDescription>
              </CardHeader>
              <CardContent>
                {locationLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={locationData || []}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(v) => `$${v}`} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `$${value.toLocaleString()}`, 
                              name === 'serviceRevenue' ? 'Services' : name === 'productRevenue' ? 'Products' : 'Total'
                            ]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="serviceRevenue" name="Services" fill="hsl(var(--primary))" stackId="a" />
                          <Bar dataKey="productRevenue" name="Products" fill="hsl(var(--chart-2))" stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(locationData || []).map((loc, i) => (
                        <Card key={loc.location_id || i} className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-display text-sm">{loc.name}</h3>
                              <Badge variant="outline">${loc.totalRevenue.toLocaleString()}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div>
                                <p className="text-muted-foreground">Services</p>
                                <p className="font-medium">{loc.totalServices}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Products</p>
                                <p className="font-medium">{loc.totalProducts}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Trans.</p>
                                <p className="font-medium">{loc.totalTransactions}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
