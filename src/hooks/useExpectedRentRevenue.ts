import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { differenceInDays, getDaysInMonth, parseISO } from 'date-fns';

export interface ExpectedRentResult {
  expectedRent: number;
  collectedRent: number;
  collectionRate: number;
  activeRenterCount: number;
}

/**
 * Computes expected rent (from active contracts, pro-rated to the date range)
 * and collected rent (actual payments received) for a given date range.
 *
 * Expected rent logic per active contract:
 *   - monthly frequency: rent_amount * (days_in_range / days_in_month)
 *   - weekly  frequency: rent_amount * (days_in_range / 7)
 *
 * Collected rent logic:
 *   - Sum of amount_paid from rent_payments whose due_date falls within the range.
 */
export function useExpectedRentRevenue(dateFrom?: string, dateTo?: string) {
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['expected-rent-revenue', organizationId, dateFrom, dateTo],
    queryFn: async (): Promise<ExpectedRentResult> => {
      if (!organizationId || !dateFrom || !dateTo) {
        return { expectedRent: 0, collectedRent: 0, collectionRate: 0, activeRenterCount: 0 };
      }

      const from = parseISO(dateFrom);
      const to = parseISO(dateTo);
      // +1 because both endpoints are inclusive (e.g. today to today = 1 day)
      const daysInRange = differenceInDays(to, from) + 1;

      // -- Active contracts --
      const { data: contracts, error: contractsError } = await supabase
        .from('booth_rental_contracts' as any)
        .select('booth_renter_id, rent_amount, rent_frequency')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (contractsError) throw contractsError;

      const activeContracts = (contracts as any[]) || [];

      // Pro-rate each contract to the date range
      let expectedRent = 0;
      const uniqueRenters = new Set<string>();

      activeContracts.forEach((c: any) => {
        uniqueRenters.add(c.booth_renter_id);

        const amount: number = Number(c.rent_amount) || 0;
        const freq: string = c.rent_frequency;

        if (freq === 'monthly') {
          const daysInMonth = getDaysInMonth(from);
          expectedRent += amount * (daysInRange / daysInMonth);
        } else if (freq === 'weekly') {
          expectedRent += amount * (daysInRange / 7);
        } else {
          // Fallback: treat unknown frequency as monthly
          const daysInMonth = getDaysInMonth(from);
          expectedRent += amount * (daysInRange / daysInMonth);
        }
      });

      // -- Collected payments --
      const { data: payments, error: paymentsError } = await supabase
        .from('rent_payments' as any)
        .select('amount_paid')
        .eq('organization_id', organizationId)
        .gte('due_date', dateFrom)
        .lte('due_date', dateTo);

      if (paymentsError) throw paymentsError;

      let collectedRent = 0;
      ((payments as any[]) || []).forEach((p: any) => {
        collectedRent += Number(p.amount_paid) || 0;
      });

      const collectionRate = expectedRent > 0
        ? Math.min((collectedRent / expectedRent) * 100, 100)
        : collectedRent > 0 ? 100 : 0;

      return {
        expectedRent: Math.round(expectedRent),
        collectedRent: Math.round(collectedRent),
        collectionRate: Math.round(collectionRate),
        activeRenterCount: uniqueRenters.size,
      };
    },
    enabled: !!organizationId && !!dateFrom && !!dateTo,
  });
}
