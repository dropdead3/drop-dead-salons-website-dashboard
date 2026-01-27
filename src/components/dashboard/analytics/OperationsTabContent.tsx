import { useState } from 'react';
import { Tabs, TabsContent, SubTabsList, SubTabsTrigger } from '@/components/ui/tabs';
import { useOperationalAnalytics } from '@/hooks/useOperationalAnalytics';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';
import { useHistoricalCapacityUtilization } from '@/hooks/useHistoricalCapacityUtilization';


// Existing content components
import { OverviewContent } from '@/components/dashboard/analytics/OverviewContent';
import { AppointmentsContent } from '@/components/dashboard/analytics/AppointmentsContent';
import { ClientsContent } from '@/components/dashboard/analytics/ClientsContent';
import { StaffingContent } from '@/components/dashboard/analytics/StaffingContent';
import { StaffUtilizationContent } from '@/components/dashboard/analytics/StaffUtilizationContent';
import type { AnalyticsFilters } from '@/pages/dashboard/admin/AnalyticsHub';

interface OperationsTabContentProps {
  filters: AnalyticsFilters;
  subTab?: string;
  onSubTabChange: (value: string) => void;
}

// Map analytics hub date ranges to operational analytics date ranges
function mapDateRange(dateRange: string): 'tomorrow' | '7days' | '30days' | '90days' {
  switch (dateRange) {
    case 'today':
    case 'yesterday':
      return 'tomorrow';
    case '7d':
    case 'thisWeek':
      return '7days';
    case '30d':
    case 'thisMonth':
    case 'lastMonth':
      return '30days';
    case '90d':
      return '90days';
    default:
      return '30days';
  }
}

export function OperationsTabContent({ filters, subTab = 'overview', onSubTabChange }: OperationsTabContentProps) {
  const locationFilter = filters.locationId !== 'all' ? filters.locationId : undefined;
  const operationalDateRange = mapDateRange(filters.dateRange);

  const { 
    dailyVolume, 
    hourlyDistribution, 
    statusBreakdown, 
    retention, 
    summary,
    isLoading 
  } = useOperationalAnalytics(locationFilter, operationalDateRange);

  const { workload, isLoading: utilizationLoading } = useStaffUtilization(
    locationFilter,
    operationalDateRange
  );

  const { capacityData, isLoading: capacityLoading } = useHistoricalCapacityUtilization(
    locationFilter,
    operationalDateRange
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          View
        </span>
        <Tabs value={subTab} onValueChange={onSubTabChange}>
          <SubTabsList>
            <SubTabsTrigger value="overview">Overview</SubTabsTrigger>
            <SubTabsTrigger value="appointments">Appointments</SubTabsTrigger>
            <SubTabsTrigger value="clients">Clients</SubTabsTrigger>
            <SubTabsTrigger value="staffing">Staffing</SubTabsTrigger>
            <SubTabsTrigger value="staff-utilization">Staff Utilization</SubTabsTrigger>
          </SubTabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewContent 
            summary={summary}
            retention={retention}
            dailyVolume={dailyVolume}
            statusBreakdown={statusBreakdown}
            isLoading={isLoading}
            onNavigateToTab={onSubTabChange}
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
            dateRange={operationalDateRange}
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
            dateRange={operationalDateRange}
          />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

