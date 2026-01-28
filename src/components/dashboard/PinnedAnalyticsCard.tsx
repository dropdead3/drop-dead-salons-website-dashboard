import { useMemo, useState } from 'react';
import { format, startOfMonth, subDays, startOfWeek } from 'date-fns';
import { VisibilityGate } from '@/components/visibility';
import { AggregateSalesCard } from '@/components/dashboard/AggregateSalesCard';
import { ForecastingCard } from '@/components/dashboard/sales/ForecastingCard';
import { CapacityUtilizationCard } from '@/components/dashboard/sales/CapacityUtilizationCard';
import { NewBookingsCard } from '@/components/dashboard/NewBookingsCard';
import { TopPerformersCard } from '@/components/dashboard/sales/TopPerformersCard';
import { RevenueDonutChart } from '@/components/dashboard/sales/RevenueDonutChart';
import { ClientFunnelCard } from '@/components/dashboard/sales/ClientFunnelCard';
import { TeamGoalsCard } from '@/components/dashboard/sales/TeamGoalsCard';
import { HiringCapacityCard } from '@/components/dashboard/HiringCapacityCard';
import { StaffingTrendChart } from '@/components/dashboard/StaffingTrendChart';
import { StylistWorkloadCard } from '@/components/dashboard/StylistWorkloadCard';
import { OperationsQuickStats } from '@/components/dashboard/operations/OperationsQuickStats';
import { useSalesMetrics, useSalesByStylist } from '@/hooks/useSalesData';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';

export type DateRangeType = 'today' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';

// Helper function to get date range
export function getDateRange(dateRange: DateRangeType): { dateFrom: string; dateTo: string } {
  const now = new Date();
  switch (dateRange) {
    case 'today':
      return { dateFrom: format(now, 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
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
    case 'lastMonth': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { 
        dateFrom: format(lastMonth, 'yyyy-MM-dd'), 
        dateTo: format(lastDay, 'yyyy-MM-dd') 
      };
    }
    default:
      return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
  }
}

export interface AnalyticsFilters {
  locationId: string;
  dateRange: DateRangeType;
  dateFrom: string;
  dateTo: string;
}

interface PinnedAnalyticsCardProps {
  cardId: string;
  filters: AnalyticsFilters;
}

/**
 * Renders a single pinned analytics card with shared filters.
 * This component is used by DashboardHome to render individual analytics cards
 * that have been placed inline with other dashboard sections.
 */
export function PinnedAnalyticsCard({ cardId, filters }: PinnedAnalyticsCardProps) {
  const locationFilter = filters.locationId !== 'all' ? filters.locationId : undefined;
  
  // Fetch data for cards that need it
  const { data: salesData } = useSalesMetrics({ 
    dateFrom: filters.dateFrom, 
    dateTo: filters.dateTo,
    locationId: locationFilter,
  });
  const { data: performers, isLoading: isLoadingPerformers } = useSalesByStylist(
    filters.dateFrom, 
    filters.dateTo
  );
  const { workload, isLoading: isLoadingWorkload } = useStaffUtilization(undefined, '30days');
  
  // Transform performers data to match TopPerformersCard expected format
  const performersForCard = performers?.map(p => ({
    user_id: p.user_id,
    name: p.name,
    photo_url: p.photo_url,
    totalRevenue: p.totalRevenue,
  })) || [];
  
  switch (cardId) {
    case 'operations_stats':
      return (
        <VisibilityGate 
          elementKey="operations_quick_stats"
          elementName="Operations Quick Stats"
          elementCategory="operations"
        >
          <OperationsQuickStats locationId={locationFilter} />
        </VisibilityGate>
      );
    case 'sales_overview':
      return (
        <VisibilityGate elementKey="sales_overview">
          <AggregateSalesCard />
        </VisibilityGate>
      );
    case 'top_performers':
      return (
        <VisibilityGate elementKey="top_performers">
          <TopPerformersCard 
            performers={performersForCard} 
            isLoading={isLoadingPerformers} 
          />
        </VisibilityGate>
      );
    case 'revenue_breakdown':
      return (
        <VisibilityGate elementKey="revenue_breakdown">
          <RevenueDonutChart 
            serviceRevenue={salesData?.serviceRevenue || 0}
            productRevenue={salesData?.productRevenue || 0}
          />
        </VisibilityGate>
      );
    case 'client_funnel':
      return (
        <VisibilityGate elementKey="client_funnel">
          <ClientFunnelCard dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
        </VisibilityGate>
      );
    case 'team_goals':
      return (
        <VisibilityGate elementKey="team_goals">
          <TeamGoalsCard currentRevenue={salesData?.totalRevenue || 0} />
        </VisibilityGate>
      );
    case 'new_bookings':
      return (
        <VisibilityGate elementKey="new_bookings">
          <NewBookingsCard />
        </VisibilityGate>
      );
    case 'week_ahead_forecast':
      return (
        <VisibilityGate elementKey="week_ahead_forecast">
          <ForecastingCard />
        </VisibilityGate>
      );
    case 'capacity_utilization':
      return (
        <VisibilityGate elementKey="capacity_utilization">
          <CapacityUtilizationCard />
        </VisibilityGate>
      );
    case 'hiring_capacity':
      return (
        <VisibilityGate elementKey="hiring_capacity">
          <HiringCapacityCard />
        </VisibilityGate>
      );
    case 'staffing_trends':
      return (
        <VisibilityGate elementKey="staffing_trends">
          <StaffingTrendChart />
        </VisibilityGate>
      );
    case 'stylist_workload':
      return (
        <VisibilityGate elementKey="stylist_workload">
          <StylistWorkloadCard 
            workload={workload || []} 
            isLoading={isLoadingWorkload} 
          />
        </VisibilityGate>
      );
    default:
      return null;
  }
}
