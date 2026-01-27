import { useState, useMemo } from 'react';
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
import { useDashboardVisibility } from '@/hooks/useDashboardVisibility';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { useSalesMetrics, useSalesByStylist } from '@/hooks/useSalesData';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';
import { useActiveLocations } from '@/hooks/useLocations';
import { Link } from 'react-router-dom';
import { Settings2, MapPin, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
};

/**
 * Command Center Analytics Section
 * 
 * Renders pinned analytics cards based on visibility settings.
 * Cards can be toggled from the Analytics Hub via "Show on Command Center" buttons.
 * Empty state shows when no cards are pinned.
 */
export function CommandCenterAnalytics() {
  const { data: visibilityData, isLoading } = useDashboardVisibility();
  const { data: profile } = useEmployeeProfile();
  const roles = useEffectiveRoles();
  
  // Shared filter state for all pinned analytics cards
  const [locationId, setLocationId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeType>('thisMonth');
  
  // Fetch locations for dropdown
  const { data: locations } = useActiveLocations();
  
  // Calculate date filters from dateRange
  const dateFilters = useMemo(() => getDateRange(dateRange), [dateRange]);
  const locationFilter = locationId !== 'all' ? locationId : undefined;
  
  // Check if any analytics cards are visible for leadership roles
  const leadershipRoles = ['super_admin', 'admin', 'manager'];
  
  const isElementVisible = (elementKey: string) => {
    if (!visibilityData) return false;
    const element = visibilityData.find(
      v => v.element_key === elementKey && leadershipRoles.includes(v.role)
    );
    return element?.is_visible ?? false;
  };
  
  // Original cards
  const hasSalesOverview = isElementVisible('sales_overview');
  const hasNewBookings = isElementVisible('new_bookings');
  const hasForecast = isElementVisible('week_ahead_forecast');
  const hasCapacity = isElementVisible('capacity_utilization');
  
  
  // New pinnable cards
  const hasSalesDashboard = isElementVisible('sales_dashboard_bento');
  const hasTopPerformers = isElementVisible('top_performers');
  const hasRevenueBreakdown = isElementVisible('revenue_breakdown');
  const hasClientFunnel = isElementVisible('client_funnel');
  const hasTeamGoals = isElementVisible('team_goals');
  const hasHiringCapacity = isElementVisible('hiring_capacity');
  const hasStaffingTrends = isElementVisible('staffing_trends');
  const hasStylistWorkload = isElementVisible('stylist_workload');
  
  const hasAnyPinned = hasSalesOverview || hasNewBookings || hasForecast || hasCapacity || 
    hasSalesDashboard || hasTopPerformers || hasRevenueBreakdown ||
    hasClientFunnel || hasTeamGoals || hasHiringCapacity ||
    hasStaffingTrends || hasStylistWorkload;
  
  // Fetch data for cards that need it (only when pinned to avoid unnecessary API calls)
  const { data: salesData } = useSalesMetrics({ 
    dateFrom: dateFilters.dateFrom, 
    dateTo: dateFilters.dateTo,
    locationId: locationFilter,
  });
  const { data: performers, isLoading: isLoadingPerformers } = useSalesByStylist(
    dateFilters.dateFrom, 
    dateFilters.dateTo
  );
  const { workload, isLoading: isLoadingWorkload } = useStaffUtilization(undefined, '30days');
  
  // Show nothing if loading
  if (isLoading) return null;
  
  // Show hint if no cards are pinned
  if (!hasAnyPinned) {
    return (
      <div className="text-center py-8 border border-dashed rounded-xl bg-muted/10">
        <Settings2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-1">
          No analytics cards pinned to Command Center
        </p>
        <p className="text-xs text-muted-foreground/70">
          Visit the{' '}
          <Link to="/dashboard/admin/analytics" className="underline hover:text-foreground transition-colors">
            Analytics Hub
          </Link>{' '}
          and use the gear icon (⚙) to pin cards here.
        </p>
      </div>
    );
  }
  
  // Transform performers data to match TopPerformersCard expected format
  const performersForCard = performers?.map(p => ({
    user_id: p.user_id,
    name: p.name,
    photo_url: p.photo_url,
    totalRevenue: p.totalRevenue,
  })) || [];
  
  return (
    <div className="space-y-6">
      {/* Shared Filter Bar - appears when any analytics cards are pinned */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Location Select */}
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="h-9 w-auto min-w-[180px] text-sm">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations?.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Date Range Select */}
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
          <SelectTrigger className="h-9 w-auto min-w-[160px] text-sm">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(DATE_RANGE_LABELS) as DateRangeType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {DATE_RANGE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Sales Dashboard Bento (consolidated card) */}
      {hasSalesDashboard && (
        <VisibilityGate elementKey="sales_dashboard_bento">
          <SalesBentoCard 
            locationId={locationId}
            dateRange={dateRange}
            dateFrom={dateFilters.dateFrom}
            dateTo={dateFilters.dateTo}
          />
        </VisibilityGate>
      )}
      
      {/* Sales Overview (legacy) */}
      {hasSalesOverview && (
        <VisibilityGate elementKey="sales_overview">
          <AggregateSalesCard />
        </VisibilityGate>
      )}
      
      {/* Top Performers & Revenue Breakdown - Side by side */}
      {(hasTopPerformers || hasRevenueBreakdown) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {hasTopPerformers && (
            <VisibilityGate elementKey="top_performers">
              <TopPerformersCard 
                performers={performersForCard} 
                isLoading={isLoadingPerformers} 
              />
            </VisibilityGate>
          )}
          {hasRevenueBreakdown && (
            <VisibilityGate elementKey="revenue_breakdown">
              <RevenueDonutChart 
                serviceRevenue={salesData?.serviceRevenue || 0}
                productRevenue={salesData?.productRevenue || 0}
              />
            </VisibilityGate>
          )}
        </div>
      )}
      
      {/* Client Funnel */}
      {hasClientFunnel && (
        <VisibilityGate elementKey="client_funnel">
          <ClientFunnelCard dateFrom={dateFilters.dateFrom} dateTo={dateFilters.dateTo} />
        </VisibilityGate>
      )}
      
      {/* Team Goals */}
      {hasTeamGoals && (
        <VisibilityGate elementKey="team_goals">
          <TeamGoalsCard currentRevenue={salesData?.totalRevenue || 0} />
        </VisibilityGate>
      )}
      
      {/* New Bookings */}
      {hasNewBookings && (
        <VisibilityGate elementKey="new_bookings">
          <NewBookingsCard />
        </VisibilityGate>
      )}
      
      {/* Forecasting */}
      {hasForecast && (
        <VisibilityGate elementKey="week_ahead_forecast">
          <ForecastingCard />
        </VisibilityGate>
      )}
      
      {/* Capacity Utilization */}
      {hasCapacity && (
        <VisibilityGate elementKey="capacity_utilization">
          <CapacityUtilizationCard />
        </VisibilityGate>
      )}
      
      {/* Hiring & Staffing Cards */}
      {(hasHiringCapacity || hasStaffingTrends) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {hasHiringCapacity && (
            <VisibilityGate elementKey="hiring_capacity">
              <HiringCapacityCard />
            </VisibilityGate>
          )}
          {hasStaffingTrends && (
            <VisibilityGate elementKey="staffing_trends">
              <StaffingTrendChart />
            </VisibilityGate>
          )}
        </div>
      )}
      
      {/* Stylist Workload */}
      {hasStylistWorkload && (
        <VisibilityGate elementKey="stylist_workload">
          <StylistWorkloadCard 
            workload={workload || []} 
            isLoading={isLoadingWorkload} 
          />
        </VisibilityGate>
      )}
      
    </div>
  );
}
