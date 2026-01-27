import { VisibilityGate } from '@/components/visibility';
import { AggregateSalesCard } from '@/components/dashboard/AggregateSalesCard';
import { ForecastingCard } from '@/components/dashboard/sales/ForecastingCard';
import { CapacityUtilizationCard } from '@/components/dashboard/sales/CapacityUtilizationCard';
import { NewBookingsCard } from '@/components/dashboard/NewBookingsCard';
import { WebsiteAnalyticsWidget } from '@/components/dashboard/WebsiteAnalyticsWidget';
import { ClientEngineOverview } from '@/components/dashboard/ClientEngineOverview';
import { OnboardingTrackerOverview } from '@/components/dashboard/OnboardingTrackerOverview';
import { StaffOverviewCard, StylistsOverviewCard } from '@/components/dashboard/StylistsOverviewCard';
import { useDashboardVisibility } from '@/hooks/useDashboardVisibility';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';

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
  
  // Top-level access: account owner (primary owner), super admin, and DOO (admin role) only
  const isTopLeadership = profile?.is_primary_owner || 
    profile?.is_super_admin || 
    roles.includes('super_admin') ||
    roles.includes('admin');
  
  // Check if any analytics cards are visible for leadership roles
  const leadershipRoles = ['super_admin', 'admin', 'manager'];
  
  const isElementVisible = (elementKey: string) => {
    if (!visibilityData) return false;
    const element = visibilityData.find(
      v => v.element_key === elementKey && leadershipRoles.includes(v.role)
    );
    return element?.is_visible ?? false;
  };
  
  const hasSalesOverview = isElementVisible('sales_overview');
  const hasNewBookings = isElementVisible('new_bookings');
  const hasForecast = isElementVisible('week_ahead_forecast');
  const hasCapacity = isElementVisible('capacity_utilization');
  const hasWebsiteAnalytics = isElementVisible('website_analytics') && isTopLeadership;
  const hasClientEngineOverview = isElementVisible('client_engine_overview');
  const hasOnboardingOverview = isElementVisible('onboarding_overview');
  const hasTeamOverview = isElementVisible('team_overview');
  const hasStylistsOverview = isElementVisible('stylists_overview');
  
  const hasAnyPinned = hasSalesOverview || hasNewBookings || hasForecast || hasCapacity || 
    hasWebsiteAnalytics || hasClientEngineOverview || hasOnboardingOverview || 
    hasTeamOverview || hasStylistsOverview;
  
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
  
  return (
    <div className="space-y-6">
      {/* Sales Overview */}
      {hasSalesOverview && (
        <VisibilityGate elementKey="sales_overview">
          <AggregateSalesCard />
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
      
      {/* Website Analytics - Top Leadership Only */}
      {hasWebsiteAnalytics && (
        <VisibilityGate elementKey="website_analytics">
          <WebsiteAnalyticsWidget />
        </VisibilityGate>
      )}
      
      {/* Client Engine Overview */}
      {hasClientEngineOverview && (
        <VisibilityGate elementKey="client_engine_overview">
          <ClientEngineOverview />
        </VisibilityGate>
      )}
      
      {/* Team Overview Cards */}
      {(hasTeamOverview || hasStylistsOverview) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {hasTeamOverview && (
            <VisibilityGate elementKey="team_overview">
              <StaffOverviewCard />
            </VisibilityGate>
          )}
          {hasStylistsOverview && (
            <VisibilityGate elementKey="stylists_overview">
              <StylistsOverviewCard />
            </VisibilityGate>
          )}
        </div>
      )}
      
      {/* Onboarding Overview */}
      {hasOnboardingOverview && (
        <VisibilityGate elementKey="onboarding_overview">
          <OnboardingTrackerOverview />
        </VisibilityGate>
      )}
    </div>
  );
}
