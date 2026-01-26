import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin } from 'lucide-react';
import { useOperationalAnalytics } from '@/hooks/useOperationalAnalytics';
import { useActiveLocations } from '@/hooks/useLocations';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';
import { useHistoricalCapacityUtilization } from '@/hooks/useHistoricalCapacityUtilization';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

// Content Components
import { OverviewContent } from '@/components/dashboard/analytics/OverviewContent';
import { AppointmentsContent } from '@/components/dashboard/analytics/AppointmentsContent';
import { ClientsContent } from '@/components/dashboard/analytics/ClientsContent';
import { StaffingContent } from '@/components/dashboard/analytics/StaffingContent';
import { StaffUtilizationContent } from '@/components/dashboard/analytics/StaffUtilizationContent';

export default function OperationalAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | '3months'>('month');
  const { data: locations = [] } = useActiveLocations();
  
  const locationFilter = selectedLocation === 'all' ? undefined : selectedLocation;
  
  const { 
    dailyVolume, 
    hourlyDistribution, 
    statusBreakdown, 
    retention, 
    summary,
    isLoading 
  } = useOperationalAnalytics(locationFilter, dateRange);

  const { workload, isLoading: utilizationLoading } = useStaffUtilization(
    locationFilter,
    dateRange
  );

  const { capacityData, isLoading: capacityLoading } = useHistoricalCapacityUtilization(
    locationFilter,
    dateRange
  );

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl mb-2">OPERATIONAL ANALYTICS</h1>
              <p className="text-muted-foreground font-sans">
                Track appointment trends, no-show rates, and client retention metrics.
              </p>
            </div>
            <CommandCenterVisibilityToggle 
              elementKey="capacity_utilization" 
              elementName="Capacity Utilization" 
            />
          </div>
          <div className="flex gap-3">
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
            <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="3months">3 Months</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="staffing">Staffing</TabsTrigger>
            <TabsTrigger value="staff-utilization">Staff Utilization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewContent 
              summary={summary}
              retention={retention}
              dailyVolume={dailyVolume}
              statusBreakdown={statusBreakdown}
              isLoading={isLoading}
              onNavigateToTab={handleTabChange}
              capacityData={capacityData}
              capacityLoading={capacityLoading}
            />
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <AppointmentsContent
              summary={summary}
              dailyVolume={dailyVolume}
              statusBreakdown={statusBreakdown}
              hourlyDistribution={hourlyDistribution}
              isLoading={isLoading}
              capacityData={capacityData}
              capacityLoading={capacityLoading}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsContent 
              retention={retention}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="staffing" className="mt-6">
            <StaffingContent 
              workload={workload}
              isLoading={utilizationLoading}
              locationId={locationFilter}
            />
          </TabsContent>

          <TabsContent value="staff-utilization" className="mt-6">
            <StaffUtilizationContent 
              locationId={locationFilter}
              dateRange={dateRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
