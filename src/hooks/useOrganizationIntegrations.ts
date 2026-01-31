import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationIntegrationStatus {
  phorest: {
    connected: boolean;
    branchCount: number;
    staffMappingCount: number;
  };
  payroll: {
    connected: boolean;
    provider: 'gusto' | 'quickbooks' | null;
    connectedAt: string | null;
  };
}

export function useOrganizationIntegrations(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-integrations', organizationId],
    queryFn: async (): Promise<OrganizationIntegrationStatus> => {
      if (!organizationId) {
        return {
          phorest: { connected: false, branchCount: 0, staffMappingCount: 0 },
          payroll: { connected: false, provider: null, connectedAt: null },
        };
      }

      // Fetch Phorest and Payroll data in parallel
      const [phorestResult, payrollResult] = await Promise.all([
        // Phorest: Get locations with phorest_branch_id and count active staff mappings
        supabase
          .from('locations')
          .select(`
            id,
            phorest_branch_id,
            phorest_staff_mapping(id, is_active)
          `)
          .eq('organization_id', organizationId)
          .not('phorest_branch_id', 'is', null),
        
        // Payroll: Get connection status
        supabase
          .from('payroll_connections')
          .select('provider, connection_status, connected_at')
          .eq('organization_id', organizationId)
          .maybeSingle(),
      ]);

      // Process Phorest data
      const phorestData = phorestResult.data || [];
      const branchIds = new Set(phorestData.map(l => l.phorest_branch_id).filter(Boolean));
      const branchCount = branchIds.size;
      const staffMappingCount = phorestData.flatMap(l => 
        Array.isArray(l.phorest_staff_mapping) ? l.phorest_staff_mapping : []
      ).filter(m => m.is_active).length;

      // Process Payroll data
      const payrollData = payrollResult.data;
      const payrollConnected = payrollData?.connection_status === 'connected';

      return {
        phorest: {
          connected: branchCount > 0,
          branchCount,
          staffMappingCount,
        },
        payroll: {
          connected: payrollConnected,
          provider: payrollData?.provider as 'gusto' | 'quickbooks' | null,
          connectedAt: payrollData?.connected_at || null,
        },
      };
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
