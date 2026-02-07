import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OrganizationBilling, SubscriptionPlan } from './useOrganizationBilling';

export interface CapacityMetrics {
  base: number;
  purchased: number;
  total: number;
  used: number;
  utilization: number;
  remaining: number;
  isUnlimited: boolean;
}

export interface OrganizationCapacity {
  locations: CapacityMetrics;
  users: CapacityMetrics;
  isOverLimit: boolean;
  nearLimit: boolean;
  locationCostPerMonth: number;
  userCostPerMonth: number;
  totalAddOnCost: number;
}

export function useOrganizationUsage(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-usage', organizationId],
    queryFn: async () => {
      if (!organizationId) return { locationCount: 0, userCount: 0 };

      // Get location count
      const { count: locationCount, error: locError } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (locError) throw locError;

      // Get active user count
      const { count: userCount, error: userError } = await supabase
        .from('employee_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (userError) throw userError;

      return {
        locationCount: locationCount || 0,
        userCount: userCount || 0,
      };
    },
    enabled: !!organizationId,
  });
}

export function calculateCapacity(
  billing: OrganizationBilling | null,
  plan: SubscriptionPlan | null,
  usage: { locationCount: number; userCount: number }
): OrganizationCapacity {
  // Default empty state - allow unlimited when no billing configured
  // This provides a graceful fallback during onboarding or for demo purposes
  if (!plan) {
    return {
      locations: {
        base: -1,
        purchased: 0,
        total: -1,
        used: usage.locationCount,
        utilization: 0,
        remaining: -1,
        isUnlimited: true,
      },
      users: {
        base: -1,
        purchased: 0,
        total: -1,
        used: usage.userCount,
        utilization: 0,
        remaining: -1,
        isUnlimited: true,
      },
      isOverLimit: false,
      nearLimit: false,
      locationCostPerMonth: 0,
      userCostPerMonth: 0,
      totalAddOnCost: 0,
    };
  }

  // Locations calculation
  const baseLocations = billing?.included_locations ?? plan.max_locations;
  const purchasedLocations = billing?.additional_locations_purchased ?? 0;
  const isUnlimitedLocations = baseLocations === -1 || baseLocations === null;
  const totalLocationCapacity = isUnlimitedLocations ? Infinity : baseLocations + purchasedLocations;
  const usedLocations = usage.locationCount;
  const locationUtilization = isUnlimitedLocations ? 0 : (totalLocationCapacity > 0 ? usedLocations / totalLocationCapacity : 0);

  // Users calculation
  const baseUsers = billing?.included_users ?? plan.max_users;
  const purchasedUsers = billing?.additional_users_purchased ?? 0;
  const isUnlimitedUsers = baseUsers === -1 || baseUsers === null;
  const totalUserCapacity = isUnlimitedUsers ? Infinity : baseUsers + purchasedUsers;
  const usedUsers = usage.userCount;
  const userUtilization = isUnlimitedUsers ? 0 : (totalUserCapacity > 0 ? usedUsers / totalUserCapacity : 0);

  // Costs
  const perLocationFee = billing?.per_location_fee ?? 0;
  const perUserFee = billing?.per_user_fee ?? 0;
  const locationCostPerMonth = purchasedLocations * perLocationFee;
  const userCostPerMonth = purchasedUsers * perUserFee;

  return {
    locations: {
      base: isUnlimitedLocations ? -1 : baseLocations,
      purchased: purchasedLocations,
      total: isUnlimitedLocations ? -1 : totalLocationCapacity,
      used: usedLocations,
      utilization: locationUtilization,
      remaining: isUnlimitedLocations ? -1 : Math.max(0, totalLocationCapacity - usedLocations),
      isUnlimited: isUnlimitedLocations,
    },
    users: {
      base: isUnlimitedUsers ? -1 : baseUsers,
      purchased: purchasedUsers,
      total: isUnlimitedUsers ? -1 : totalUserCapacity,
      used: usedUsers,
      utilization: userUtilization,
      remaining: isUnlimitedUsers ? -1 : Math.max(0, totalUserCapacity - usedUsers),
      isUnlimited: isUnlimitedUsers,
    },
    isOverLimit: (!isUnlimitedLocations && usedLocations > totalLocationCapacity) ||
                 (!isUnlimitedUsers && usedUsers > totalUserCapacity),
    nearLimit: locationUtilization > 0.8 || userUtilization > 0.8,
    locationCostPerMonth,
    userCostPerMonth,
    totalAddOnCost: locationCostPerMonth + userCostPerMonth,
  };
}

export function getUtilizationColor(utilization: number): string {
  if (utilization >= 0.95) return 'text-red-400';
  if (utilization >= 0.80) return 'text-orange-400';
  if (utilization >= 0.60) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function getUtilizationBgColor(utilization: number): string {
  if (utilization >= 0.95) return 'bg-red-500';
  if (utilization >= 0.80) return 'bg-orange-500';
  if (utilization >= 0.60) return 'bg-yellow-500';
  return 'bg-emerald-500';
}
