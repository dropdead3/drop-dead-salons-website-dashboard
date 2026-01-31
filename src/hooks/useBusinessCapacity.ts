import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeProfile } from './useEmployeeProfile';
import { useOrganizationBilling, useSubscriptionPlans } from './useOrganizationBilling';
import { calculateCapacity, useOrganizationUsage } from './useOrganizationCapacity';

export interface BusinessCapacity {
  locations: {
    total: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
  };
  users: {
    total: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
  };
  canAddLocation: boolean;
  canAddUser: boolean;
  perLocationFee: number;
  perUserFee: number;
  planName: string | null;
  basePlanPrice: number;
  additionalLocationsPurchased: number;
  additionalUsersPurchased: number;
  isLoading: boolean;
}

export function useBusinessCapacity() {
  const { data: profile } = useEmployeeProfile();
  const organizationId = profile?.organization_id;

  const { data: billing, isLoading: billingLoading } = useOrganizationBilling(organizationId ?? undefined);
  const { data: usage, isLoading: usageLoading } = useOrganizationUsage(organizationId ?? undefined);
  const { data: plans } = useSubscriptionPlans();

  const plan = plans?.find(p => p.id === billing?.plan_id) ?? null;

  const capacity = calculateCapacity(
    billing ?? null,
    plan,
    usage ?? { locationCount: 0, userCount: 0 }
  );

  const isLoading = billingLoading || usageLoading;

  return {
    locations: {
      total: capacity.locations.isUnlimited ? -1 : capacity.locations.total,
      used: capacity.locations.used,
      remaining: capacity.locations.isUnlimited ? -1 : capacity.locations.remaining,
      isUnlimited: capacity.locations.isUnlimited,
    },
    users: {
      total: capacity.users.isUnlimited ? -1 : capacity.users.total,
      used: capacity.users.used,
      remaining: capacity.users.isUnlimited ? -1 : capacity.users.remaining,
      isUnlimited: capacity.users.isUnlimited,
    },
    canAddLocation: capacity.locations.isUnlimited || capacity.locations.remaining > 0,
    canAddUser: capacity.users.isUnlimited || capacity.users.remaining > 0,
    perLocationFee: billing?.per_location_fee ?? 0,
    perUserFee: billing?.per_user_fee ?? 0,
    planName: plan?.name ?? null,
    basePlanPrice: billing?.custom_price ?? billing?.base_price ?? plan?.price_monthly ?? 0,
    additionalLocationsPurchased: billing?.additional_locations_purchased ?? 0,
    additionalUsersPurchased: billing?.additional_users_purchased ?? 0,
    organizationId,
    billingId: billing?.id,
    isLoading,
  } as BusinessCapacity & { organizationId: string | null | undefined; billingId: string | undefined };
}

export function useAddLocationSeats() {
  const { data: profile } = useEmployeeProfile();
  const organizationId = profile?.organization_id;

  const addSeats = async (seatsToAdd: number) => {
    if (!organizationId) throw new Error('No organization found');

    // Get current billing record
    const { data: billing, error: fetchError } = await supabase
      .from('organization_billing')
      .select('id, additional_locations_purchased')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    const currentSeats = billing.additional_locations_purchased ?? 0;
    const newSeats = currentSeats + seatsToAdd;

    // Update the billing record
    const { error: updateError } = await supabase
      .from('organization_billing')
      .update({ additional_locations_purchased: newSeats })
      .eq('id', billing.id);

    if (updateError) throw updateError;

    // Log the change
    const { error: logError } = await supabase
      .from('billing_changes')
      .insert({
        organization_id: organizationId,
        change_type: 'add_locations',
        previous_value: { additional_locations_purchased: currentSeats },
        new_value: { additional_locations_purchased: newSeats },
        notes: `Added ${seatsToAdd} location seat(s)`,
      });

    if (logError) console.error('Failed to log billing change:', logError);

    return { previousSeats: currentSeats, newSeats };
  };

  return { addSeats, organizationId };
}
