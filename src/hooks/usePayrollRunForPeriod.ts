import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';

/**
 * Checks if a payroll run exists for the given period with a completed-like status.
 * Used by PayrollDeadlineCard to hide itself once payroll has been submitted.
 */
export function usePayrollRunForPeriod(periodStart: Date | null, periodEnd: Date | null) {
  const { selectedOrganization } = useOrganizationContext();
  const organizationId = selectedOrganization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-run-for-period', organizationId, periodStart?.toISOString(), periodEnd?.toISOString()],
    queryFn: async () => {
      if (!organizationId || !periodStart || !periodEnd) return false;

      const startStr = format(periodStart, 'yyyy-MM-dd');
      const endStr = format(periodEnd, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('pay_period_start', startStr)
        .eq('pay_period_end', endStr)
        .in('status', ['submitted', 'processing', 'processed', 'completed'])
        .limit(1);

      if (error) {
        console.error('Error checking payroll run:', error);
        return false;
      }

      return (data?.length ?? 0) > 0;
    },
    enabled: !!organizationId && !!periodStart && !!periodEnd,
    staleTime: 60_000,
  });

  return {
    hasRun: data ?? false,
    isLoading,
  };
}
