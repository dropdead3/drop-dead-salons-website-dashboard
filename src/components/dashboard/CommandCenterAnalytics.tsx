import { useState, useMemo } from 'react';
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
import { useDashboardVisibility } from '@/hooks/useDashboardVisibility';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { useSalesMetrics, useSalesByStylist } from '@/hooks/useSalesData';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';
import { useActiveLocations } from '@/hooks/useLocations';
import { Link } from 'react-router-dom';
import { Settings2, MapPin, Calendar } from 'lucide-react';
import { format, startOfMonth, subDays, startOfWeek } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DateRangeType = 'today' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';

const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
};

// Helper function to get date range
function getDateRange(dateRange: DateRangeType): { dateFrom: string; dateTo: string } {
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

// Map of card IDs to their render components
const CARD_COMPONENTS: Record<string, string> = {
  'sales_overview': 'SalesOverview',
  'top_performers': 'TopPerformers',
  'revenue_breakdown': 'RevenueBreakdown',
  'client_funnel': 'ClientFunnel',
  'team_goals': 'TeamGoals',
  'new_bookings': 'NewBookings',
  'week_ahead_forecast': 'Forecast',
  'capacity_utilization': 'Capacity',
  'hiring_capacity': 'HiringCapacity',
  'staffing_trends': 'StaffingTrends',
  'stylist_workload': 'StylistWorkload',
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
  const { layout } = useDashboardLayout();
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
  
  // Get all visible card IDs
  const allVisibleCardIds = useMemo(() => {
    return Object.keys(CARD_COMPONENTS).filter(id => isElementVisible(id));
  }, [visibilityData]);
  
  // Order visible cards by user's preferred order (from pinnedCards)
  const orderedVisibleCards = useMemo(() => {
    const savedOrder = layout.pinnedCards || [];
    
    // Start with cards in saved order that are visible
    const fromSavedOrder = savedOrder.filter(id => allVisibleCardIds.includes(id));
    
    // Add any visible cards not in saved order
    const notInOrder = allVisibleCardIds.filter(id => !savedOrder.includes(id));
    
    return [...fromSavedOrder, ...notInOrder];
  }, [layout.pinnedCards, allVisibleCardIds]);
  
  const hasAnyPinned = orderedVisibleCards.length > 0;
  
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
  
  // Render a card by its ID
  const renderCard = (cardId: string) => {
    switch (cardId) {
      case 'sales_overview':
        return (
          <VisibilityGate key={cardId} elementKey="sales_overview">
            <AggregateSalesCard />
          </VisibilityGate>
        );
      case 'top_performers':
        return (
          <VisibilityGate key={cardId} elementKey="top_performers">
            <TopPerformersCard 
              performers={performersForCard} 
              isLoading={isLoadingPerformers} 
            />
          </VisibilityGate>
        );
      case 'revenue_breakdown':
        return (
          <VisibilityGate key={cardId} elementKey="revenue_breakdown">
            <RevenueDonutChart 
              serviceRevenue={salesData?.serviceRevenue || 0}
              productRevenue={salesData?.productRevenue || 0}
            />
          </VisibilityGate>
        );
      case 'client_funnel':
        return (
          <VisibilityGate key={cardId} elementKey="client_funnel">
            <ClientFunnelCard dateFrom={dateFilters.dateFrom} dateTo={dateFilters.dateTo} />
          </VisibilityGate>
        );
      case 'team_goals':
        return (
          <VisibilityGate key={cardId} elementKey="team_goals">
            <TeamGoalsCard currentRevenue={salesData?.totalRevenue || 0} />
          </VisibilityGate>
        );
      case 'new_bookings':
        return (
          <VisibilityGate key={cardId} elementKey="new_bookings">
            <NewBookingsCard />
          </VisibilityGate>
        );
      case 'week_ahead_forecast':
        return (
          <VisibilityGate key={cardId} elementKey="week_ahead_forecast">
            <ForecastingCard />
          </VisibilityGate>
        );
      case 'capacity_utilization':
        return (
          <VisibilityGate key={cardId} elementKey="capacity_utilization">
            <CapacityUtilizationCard />
          </VisibilityGate>
        );
      case 'hiring_capacity':
        return (
          <VisibilityGate key={cardId} elementKey="hiring_capacity">
            <HiringCapacityCard />
          </VisibilityGate>
        );
      case 'staffing_trends':
        return (
          <VisibilityGate key={cardId} elementKey="staffing_trends">
            <StaffingTrendChart />
          </VisibilityGate>
        );
      case 'stylist_workload':
        return (
          <VisibilityGate key={cardId} elementKey="stylist_workload">
            <StylistWorkloadCard 
              workload={workload || []} 
              isLoading={isLoadingWorkload} 
            />
          </VisibilityGate>
        );
      default:
        return null;
    }
  };
  
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
      
      {/* Render cards in user's preferred order */}
      {orderedVisibleCards.map(cardId => renderCard(cardId))}
    </div>
  );
}
