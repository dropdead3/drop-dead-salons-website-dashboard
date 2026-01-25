import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award,
  Megaphone 
} from 'lucide-react';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { useActiveLocations } from '@/hooks/useLocations';
import { CampaignPerformanceTable } from '@/components/dashboard/marketing/CampaignPerformanceTable';
import { SourceBreakdownChart } from '@/components/dashboard/marketing/SourceBreakdownChart';
import { MediumDistributionChart } from '@/components/dashboard/marketing/MediumDistributionChart';

type DateRange = 'week' | 'month' | '3months';

export default function MarketingAnalytics() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  
  const { data: locations = [] } = useActiveLocations();
  const locationFilter = selectedLocation === 'all' ? undefined : selectedLocation;
  
  const { data: analytics, isLoading } = useMarketingAnalytics(dateRange, locationFilter);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header with filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">MARKETING ANALYTICS</h1>
            <p className="text-muted-foreground font-sans">
              Track UTM campaign performance, conversion rates, and revenue attribution.
            </p>
          </div>
          <div className="flex gap-3">
            {/* Location filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Date range tabs */}
            <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="3months">3 Months</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="premium-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Megaphone className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold tabular-nums">
                  {analytics?.summary.totalCampaigns ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Active Campaigns</span>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Users className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold tabular-nums">
                  {analytics?.summary.totalLeads ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Marketing Leads</span>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <DollarSign className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold tabular-nums">
                  ${(analytics?.summary.totalRevenue ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">Attributed Revenue</span>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold tabular-nums">
                  {(analytics?.summary.overallConversionRate ?? 0).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Conversion Rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card col-span-2 md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Award className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-lg font-bold truncate max-w-full px-2">
                  {analytics?.summary.topCampaign || '—'}
                </span>
                <span className="text-xs text-muted-foreground">Top Campaign</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <div className="mb-6">
          <CampaignPerformanceTable 
            campaigns={analytics?.campaigns ?? []} 
            isLoading={isLoading} 
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SourceBreakdownChart 
            sources={analytics?.sources ?? []} 
            isLoading={isLoading} 
          />
          <MediumDistributionChart 
            mediums={analytics?.mediums ?? []} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
