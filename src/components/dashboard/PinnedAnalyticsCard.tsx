import { useMemo, useState } from 'react';
import { VisibilityGate } from '@/components/visibility';
import { AggregateSalesCard } from '@/components/dashboard/AggregateSalesCard';
import { ForecastingCard } from '@/components/dashboard/sales/ForecastingCard';
import { CapacityUtilizationCard } from '@/components/dashboard/sales/CapacityUtilizationCard';
import { NewBookingsCard } from '@/components/dashboard/NewBookingsCard';
import { SalesBentoCard, getDateRange, type DateRangeType } from '@/components/dashboard/sales/SalesBentoCard';
import { TopPerformersCard } from '@/components/dashboard/sales/TopPerformersCard';
import { RevenueDonutChart } from '@/components/dashboard/sales/RevenueDonutChart';
import { ClientFunnelCard } from '@/components/dashboard/sales/ClientFunnelCard';
import { TeamGoalsCard } from '@/components/dashboard/sales/TeamGoalsCard';
import { HiringCapacityCard } from '@/components/dashboard/HiringCapacityCard';
import { StaffingTrendChart } from '@/components/dashboard/StaffingTrendChart';
import { StylistWorkloadCard } from '@/components/dashboard/StylistWorkloadCard';
import { useSalesMetrics, useSalesByStylist } from '@/hooks/useSalesData';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';

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
    case 'sales_dashboard_bento':
      return (
        <VisibilityGate elementKey="sales_dashboard_bento">
          <SalesBentoCard 
            locationId={filters.locationId}
            dateRange={filters.dateRange}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
          />
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
