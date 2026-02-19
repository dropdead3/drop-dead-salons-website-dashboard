import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays, startOfWeek } from 'date-fns';
import { VisibilityGate, useElementVisibility } from '@/components/visibility';
import { PinnableCard } from '@/components/dashboard/PinnableCard';
import { Card } from '@/components/ui/card';
import { AggregateSalesCard, DateRange as SalesDateRange } from '@/components/dashboard/AggregateSalesCard';
import {
  DollarSign, TrendingUp, Users, Clock, BarChart3, Heart,
  Activity, MapPin, Scissors, ShoppingBag, CalendarCheck,
  Target, Gauge, FileText, Sparkles, Briefcase, UserPlus,
  LineChart, BarChart2,
} from 'lucide-react';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useFormatNumber } from '@/hooks/useFormatNumber';
import { useRebookingRate } from '@/hooks/useRebookingRate';
import { ForecastingCard } from '@/components/dashboard/sales/ForecastingCard';
import { CapacityUtilizationCard } from '@/components/dashboard/sales/CapacityUtilizationCard';
import { NewBookingsCard } from '@/components/dashboard/NewBookingsCard';
import { TopPerformersCard } from '@/components/dashboard/sales/TopPerformersCard';
import { RevenueDonutChart } from '@/components/dashboard/sales/RevenueDonutChart';
import { ClientFunnelCard } from '@/components/dashboard/sales/ClientFunnelCard';
import { TeamGoalsCard } from '@/components/dashboard/sales/TeamGoalsCard';
import { GoalTrackerCard } from '@/components/dashboard/sales/GoalTrackerCard';
import { HiringCapacityCard } from '@/components/dashboard/HiringCapacityCard';
import { StaffingTrendChart } from '@/components/dashboard/StaffingTrendChart';
import { StylistWorkloadCard } from '@/components/dashboard/StylistWorkloadCard';
import { OperationsQuickStats } from '@/components/dashboard/operations/OperationsQuickStats';
import { ExecutiveSummaryCard } from '@/components/dashboard/analytics/ExecutiveSummaryCard';
import { ClientHealthSummaryCard } from '@/components/dashboard/client-health/ClientHealthSummaryCard';
import { DailyBriefCard } from '@/components/dashboard/analytics/DailyBriefCard';
import { OperationalHealthCard } from '@/components/dashboard/analytics/OperationalHealthCard';
import { LocationsRollupCard } from '@/components/dashboard/analytics/LocationsRollupCard';
import { ServiceMixCard } from '@/components/dashboard/analytics/ServiceMixCard';
import { RetailEffectivenessCard } from '@/components/dashboard/analytics/RetailEffectivenessCard';
import { RebookingCard } from '@/components/dashboard/analytics/RebookingCard';
import { useSalesMetrics, useSalesByStylist } from '@/hooks/useSalesData';
import { useRetailAttachmentRate } from '@/hooks/useRetailAttachmentRate';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';
import { useLocations } from '@/hooks/useLocations';
import { useUserLocationAccess } from '@/hooks/useUserLocationAccess';
import type { FilterContext } from '@/components/dashboard/AnalyticsFilterBadge';
import { getNextPayDay, type PayScheduleSettings } from '@/hooks/usePaySchedule';

export type DateRangeType = 'today' | 'yesterday' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'todayToEom' | 'todayToPayday' | 'lastMonth';

// Map pinned cards to their parent analytics tab visibility keys
// If the parent tab is hidden, the card should also be hidden
const CARD_TO_TAB_MAP: Record<string, string> = {
  'executive_summary': 'analytics_leadership_tab',
  'sales_overview': 'analytics_sales_tab',
  'top_performers': 'analytics_sales_tab',
  'revenue_breakdown': 'analytics_sales_tab',
  'team_goals': 'analytics_sales_tab',
  'goal_tracker': 'analytics_sales_tab',
  'week_ahead_forecast': 'analytics_sales_tab',
  'capacity_utilization': 'analytics_operations_tab',
  'operations_stats': 'analytics_operations_tab',
  'new_bookings': 'analytics_operations_tab',
  'hiring_capacity': 'analytics_operations_tab',
  'staffing_trends': 'analytics_operations_tab',
  'stylist_workload': 'analytics_operations_tab',
  'client_funnel': 'analytics_marketing_tab',
  'client_health': 'analytics_operations_tab',
  'daily_brief': 'analytics_leadership_tab',
  'operational_health': 'analytics_operations_tab',
  'locations_rollup': 'analytics_sales_tab',
  'service_mix': 'analytics_sales_tab',
  'retail_effectiveness': 'analytics_sales_tab',
  'rebooking': 'analytics_operations_tab',
  'client_experience_staff': 'analytics_sales_tab',
};

// Map dashboard date range to Sales Overview date range
function mapToSalesDateRange(dashboardRange: DateRangeType): SalesDateRange {
  const mapping: Record<DateRangeType, SalesDateRange> = {
    'today': 'today',
    'yesterday': 'yesterday',
    '7d': '7d',
    '30d': '30d',
    'thisWeek': 'thisWeek',
    'thisMonth': 'mtd',
    'todayToEom': 'todayToEom',
    'todayToPayday': 'todayToEom', // Fallback for sales card
    'lastMonth': '30d',
  };
  return mapping[dashboardRange] || 'today';
}

export { type FilterContext };

// Helper function to get date range
export function getDateRange(
  dateRange: DateRangeType, 
  payScheduleSettings?: PayScheduleSettings | null
): { dateFrom: string; dateTo: string } {
  const now = new Date();
  switch (dateRange) {
    case 'today':
      return { dateFrom: format(now, 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { dateFrom: format(yesterday, 'yyyy-MM-dd'), dateTo: format(yesterday, 'yyyy-MM-dd') };
    }
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
    case 'todayToPayday': {
      const nextPayDay = getNextPayDay(payScheduleSettings || null);
      return { 
        dateFrom: format(now, 'yyyy-MM-dd'), 
        dateTo: format(nextPayDay, 'yyyy-MM-dd') 
      };
    }
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
  compact?: boolean;
}

// Icon + label mapping for each card in compact mode
const CARD_META: Record<string, { icon: React.ElementType; label: string }> = {
  executive_summary: { icon: Sparkles, label: 'Executive Summary' },
  daily_brief: { icon: FileText, label: 'Daily Brief' },
  sales_overview: { icon: DollarSign, label: 'Sales Overview' },
  top_performers: { icon: TrendingUp, label: 'Top Performers' },
  operations_stats: { icon: Clock, label: 'Operations' },
  revenue_breakdown: { icon: BarChart3, label: 'Revenue Breakdown' },
  client_funnel: { icon: Users, label: 'Client Funnel' },
  client_health: { icon: Heart, label: 'Client Health' },
  operational_health: { icon: Activity, label: 'Operational Health' },
  locations_rollup: { icon: MapPin, label: 'Locations Rollup' },
  service_mix: { icon: Scissors, label: 'Service Mix' },
  retail_effectiveness: { icon: ShoppingBag, label: 'Retail Effectiveness' },
  rebooking: { icon: CalendarCheck, label: 'Rebooking Rate' },
  team_goals: { icon: Target, label: 'Team Goals' },
  goal_tracker: { icon: Target, label: 'Goal Tracker' },
  capacity_utilization: { icon: Gauge, label: 'Capacity Utilization' },
  week_ahead_forecast: { icon: LineChart, label: 'Week Ahead Forecast' },
  new_bookings: { icon: UserPlus, label: 'New Bookings' },
  hiring_capacity: { icon: Briefcase, label: 'Hiring Capacity' },
  staffing_trends: { icon: BarChart2, label: 'Staffing Trends' },
  stylist_workload: { icon: Users, label: 'Stylist Workload' },
  client_experience_staff: { icon: Users, label: 'Client Experience' },
};

/**
 * Renders a single pinned analytics card with shared filters.
 * This component is used by DashboardHome to render individual analytics cards
 * that have been placed inline with other dashboard sections.
 */
export function PinnedAnalyticsCard({ cardId, filters, compact = false }: PinnedAnalyticsCardProps) {
  // Check if parent tab is visible - if not, hide this card
  const parentTabKey = CARD_TO_TAB_MAP[cardId];
  const parentTabVisible = useElementVisibility(parentTabKey || '');
  
  const locationFilter = filters.locationId !== 'all' ? filters.locationId : undefined;
  
  // Create filter context for cards that display it
  const filterContext: FilterContext = {
    locationId: filters.locationId,
    dateRange: filters.dateRange,
  };
  
  // Fetch data for cards that need it - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
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
  const { data: attachmentData, isLoading: isLoadingAttachment } = useRetailAttachmentRate({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    locationId: locationFilter,
  });
  
  const { accessibleLocations } = useUserLocationAccess();
  const { data: locations } = useLocations();
  const { data: rebookData } = useRebookingRate(filters.dateFrom, filters.dateTo, filters.locationId);
  const { formatCurrencyWhole } = useFormatCurrency();
  const { formatPercent } = useFormatNumber();
  const selectedLocationName = locationFilter
    ? locations?.find(l => l.id === locationFilter)?.name || 'Unknown'
    : 'All Locations';
  
  // Transform performers data to match TopPerformersCard expected format
  const performersForCard = performers?.map(p => ({
    user_id: p.user_id,
    name: p.name,
    photo_url: p.photo_url,
    totalRevenue: p.totalRevenue,
  })) || [];
  
  // If parent tab is hidden and we have a mapping, don't render the card
  // This check MUST come AFTER all hooks are called
  if (parentTabKey && !parentTabVisible) {
    return null;
  }

  // ── Compact (simple) view ──────────────────────────────────────
  if (compact) {
    const meta = CARD_META[cardId] || { icon: BarChart3, label: cardId };
    const Icon = meta.icon;
    
    // Extract primary metric per card
    let metricValue = '';
    let metricLabel = '';
    
    switch (cardId) {
      case 'executive_summary':
      case 'sales_overview':
        metricValue = formatCurrencyWhole(salesData?.totalRevenue ?? 0);
        metricLabel = 'revenue';
        break;
      case 'daily_brief':
        metricValue = formatCurrencyWhole(salesData?.totalRevenue ?? 0);
        metricLabel = 'today';
        break;
      case 'top_performers': {
        const top = performersForCard[0];
        if (top) {
          metricValue = `${top.name.split(' ')[0]} · ${formatCurrencyWhole(top.totalRevenue)}`;
          metricLabel = '#1';
        } else {
          metricValue = '—';
          metricLabel = '';
        }
        break;
      }
      case 'operations_stats':
        metricValue = '—';
        metricLabel = 'queue';
        break;
      case 'revenue_breakdown':
        metricValue = `${formatCurrencyWhole(salesData?.serviceRevenue ?? 0)} / ${formatCurrencyWhole(salesData?.productRevenue ?? 0)}`;
        metricLabel = 'svc / retail';
        break;
      case 'retail_effectiveness':
        metricValue = attachmentData ? formatPercent(attachmentData.attachmentRate) : '—';
        metricLabel = 'attach rate';
        break;
      case 'rebooking':
        metricValue = rebookData ? formatPercent(rebookData.rebookRate) : '—';
        metricLabel = 'rebook';
        break;
      case 'team_goals':
        metricValue = formatCurrencyWhole(salesData?.totalRevenue ?? 0);
        metricLabel = 'progress';
        break;
      case 'capacity_utilization': {
        const avgUtil = workload?.length
          ? Math.round(workload.reduce((s, w) => s + w.utilizationScore, 0) / workload.length)
          : 0;
        metricValue = `${avgUtil}%`;
        metricLabel = 'utilization';
        break;
      }
      default:
        metricValue = '—';
        metricLabel = '';
    }
    
    const visKey = cardId === 'operations_stats' ? 'operations_quick_stats' : cardId;
    
    return (
      <VisibilityGate elementKey={visKey}>
        <PinnableCard
          elementKey={visKey}
          elementName={meta.label}
          category="Command Center"
          dateRange={filters.dateRange}
          locationName={selectedLocationName}
        >
          <Card className="flex items-center gap-3 px-4 py-3 h-14">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium truncate">{meta.label}</span>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {metricLabel && (
                <span className="text-xs text-muted-foreground hidden sm:inline">{metricLabel}</span>
              )}
              <span className="text-sm font-semibold tabular-nums">{metricValue}</span>
            </div>
          </Card>
        </PinnableCard>
      </VisibilityGate>
    );
  }
  
  switch (cardId) {
    case 'executive_summary':
      return (
        <VisibilityGate elementKey="executive_summary">
          <PinnableCard elementKey="executive_summary" elementName="Executive Summary" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <ExecutiveSummaryCard
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'operational_health':
      return (
        <VisibilityGate elementKey="operational_health">
          <PinnableCard elementKey="operational_health" elementName="Operational Health" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <OperationalHealthCard
              filterContext={filterContext}
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              locationId={filters.locationId}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'operations_stats':
      return (
        <VisibilityGate 
          elementKey="operations_quick_stats"
          elementName="Operations Quick Stats"
          elementCategory="operations"
        >
          <PinnableCard elementKey="operations_quick_stats" elementName="Operations Quick Stats" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <OperationsQuickStats locationId={locationFilter} filterContext={filterContext} />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'sales_overview':
      return (
        <VisibilityGate elementKey="sales_overview">
          <PinnableCard elementKey="sales_overview" elementName="Sales Overview" category="Command Center"
            metricData={{
              "Total Revenue": salesData?.totalRevenue || 0,
              "Service Revenue": salesData?.serviceRevenue || 0,
              "Product Revenue": salesData?.productRevenue || 0,
              "Average Ticket": salesData?.averageTicket || 0,
            }}
            dateRange={filters.dateRange}
            locationName={selectedLocationName}
          >
            <AggregateSalesCard 
              externalDateRange={mapToSalesDateRange(filters.dateRange)}
              externalDateFilters={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
              hideInternalFilter={true}
              filterContext={filterContext}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'top_performers':
      return (
        <VisibilityGate elementKey="top_performers">
          <PinnableCard elementKey="top_performers" elementName="Top Performers" category="Command Center"
            metricData={performersForCard.slice(0, 5).reduce((acc, p, i) => {
              acc[`#${i + 1} ${p.name}`] = p.totalRevenue;
              return acc;
            }, {} as Record<string, string | number>)}
            dateRange={filters.dateRange}
            locationName={selectedLocationName}
          >
            <TopPerformersCard 
              performers={performersForCard} 
              isLoading={isLoadingPerformers}
              filterContext={filterContext}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'locations_rollup':
      return (
        <VisibilityGate elementKey="locations_rollup">
          <PinnableCard elementKey="locations_rollup" elementName="Locations Rollup" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <LocationsRollupCard filterContext={filterContext} dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'service_mix':
      return (
        <VisibilityGate elementKey="service_mix">
          <PinnableCard elementKey="service_mix" elementName="Service Mix" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <ServiceMixCard
              filterContext={filterContext}
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              locationId={filters.locationId}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'retail_effectiveness':
      return (
        <VisibilityGate elementKey="retail_effectiveness">
          <PinnableCard elementKey="retail_effectiveness" elementName="Retail Effectiveness" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <RetailEffectivenessCard
              filterContext={filterContext}
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              locationId={filters.locationId}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'rebooking':
      return (
        <VisibilityGate elementKey="rebooking">
          <PinnableCard elementKey="rebooking" elementName="Rebooking Rate" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <RebookingCard
              filterContext={filterContext}
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              locationId={filters.locationId}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'revenue_breakdown':
      return (
        <VisibilityGate elementKey="revenue_breakdown">
          <PinnableCard elementKey="revenue_breakdown" elementName="Revenue Breakdown" category="Command Center"
            metricData={{
              "Service Revenue": salesData?.serviceRevenue || 0,
              "Product Revenue": salesData?.productRevenue || 0,
            }}
            dateRange={filters.dateRange}
            locationName={selectedLocationName}
          >
            <RevenueDonutChart 
              serviceRevenue={salesData?.serviceRevenue || 0}
              productRevenue={salesData?.productRevenue || 0}
              filterContext={filterContext}
              retailAttachmentRate={attachmentData?.attachmentRate}
              retailAttachmentLoading={isLoadingAttachment}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'client_health':
      return (
        <VisibilityGate elementKey="client_health">
          <PinnableCard elementKey="client_health" elementName="Client Health" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <ClientHealthSummaryCard />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'daily_brief':
      return (
        <VisibilityGate elementKey="daily_brief">
          <PinnableCard elementKey="daily_brief" elementName="Daily Brief" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <DailyBriefCard filterContext={filterContext} locationId={filters.locationId} />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'client_funnel':
      return (
        <VisibilityGate elementKey="client_funnel">
          <PinnableCard elementKey="client_funnel" elementName="Client Funnel" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <ClientFunnelCard 
              dateFrom={filters.dateFrom} 
              dateTo={filters.dateTo}
              filterContext={filterContext}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'team_goals':
      return (
        <VisibilityGate elementKey="team_goals">
          <PinnableCard elementKey="team_goals" elementName="Team Goals" category="Command Center"
            metricData={{
              "Current Revenue": salesData?.totalRevenue || 0,
            }}
            dateRange={filters.dateRange}
            locationName={selectedLocationName}
          >
            <TeamGoalsCard 
              currentRevenue={salesData?.totalRevenue || 0}
              filterContext={filterContext}
            />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'goal_tracker':
      return (
        <VisibilityGate elementKey="goal_tracker">
          <GoalTrackerCard />
        </VisibilityGate>
      );
    case 'new_bookings':
      return (
        <VisibilityGate elementKey="new_bookings">
          <PinnableCard elementKey="new_bookings" elementName="New Bookings" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <NewBookingsCard filterContext={filterContext} />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'week_ahead_forecast':
      return (
        <VisibilityGate elementKey="week_ahead_forecast">
          <PinnableCard elementKey="week_ahead_forecast" elementName="Week Ahead Forecast" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <ForecastingCard />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'capacity_utilization':
      return (
        <VisibilityGate elementKey="capacity_utilization">
          <PinnableCard elementKey="capacity_utilization" elementName="Capacity Utilization" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <CapacityUtilizationCard />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'hiring_capacity':
      return (
        <VisibilityGate elementKey="hiring_capacity">
          <PinnableCard elementKey="hiring_capacity" elementName="Hiring Capacity" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <HiringCapacityCard />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'staffing_trends':
      return (
        <VisibilityGate elementKey="staffing_trends">
          <PinnableCard elementKey="staffing_trends" elementName="Staffing Trends" category="Command Center" dateRange={filters.dateRange} locationName={selectedLocationName}>
            <StaffingTrendChart />
          </PinnableCard>
        </VisibilityGate>
      );
    case 'stylist_workload':
      return (
        <VisibilityGate elementKey="stylist_workload">
          <PinnableCard elementKey="stylist_workload" elementName="Stylist Workload" category="Command Center"
            metricData={workload?.slice(0, 5).reduce((acc, w) => {
              acc[`${w.name} Utilization`] = `${w.utilizationScore}%`;
              acc[`${w.name} Appointments`] = w.appointmentCount;
              return acc;
            }, {} as Record<string, string | number>)}
            dateRange={filters.dateRange}
            locationName={selectedLocationName}
          >
            <StylistWorkloadCard 
              workload={workload || []} 
              isLoading={isLoadingWorkload} 
            />
          </PinnableCard>
        </VisibilityGate>
      );
    default:
      return null;
  }
}
