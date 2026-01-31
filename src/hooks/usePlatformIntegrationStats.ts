import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Barcode, DollarSign, LucideIcon } from 'lucide-react';

export interface IntegrationStat {
  id: string;
  name: string;
  icon: LucideIcon;
  connectedCount: number;
  status: 'healthy' | 'issues' | 'not_configured';
  details: string;
}

export interface PlatformIntegrationStats {
  integrations: IntegrationStat[];
  totalActive: number;
  totalAvailable: number;
}

export function usePlatformIntegrationStats() {
  return useQuery({
    queryKey: ['platform-integration-stats'],
    queryFn: async (): Promise<PlatformIntegrationStats> => {
      // Fetch Phorest stats - count distinct organizations with active mappings
      const { count: phorestActiveCount } = await supabase
        .from('phorest_staff_mapping')
        .select('phorest_branch_id', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: phorestInactiveCount } = await supabase
        .from('phorest_staff_mapping')
        .select('phorest_branch_id', { count: 'exact', head: true })
        .eq('is_active', false);

      // Fetch Payroll stats
      const { count: payrollConnected } = await supabase
        .from('payroll_connections')
        .select('organization_id', { count: 'exact', head: true })
        .eq('connection_status', 'connected');

      const { count: payrollError } = await supabase
        .from('payroll_connections')
        .select('organization_id', { count: 'exact', head: true })
        .eq('connection_status', 'error');

      // Fetch PandaDoc stats
      const { count: pandaDocCount } = await supabase
        .from('pandadoc_documents')
        .select('id', { count: 'exact', head: true });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: recentPandaDocCount } = await supabase
        .from('pandadoc_documents')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Determine statuses
      const phorestStatus: IntegrationStat['status'] = 
        (phorestActiveCount || 0) > 0 ? 'healthy' : 
        (phorestInactiveCount || 0) > 0 ? 'issues' : 'not_configured';

      const payrollStatus: IntegrationStat['status'] = 
        (payrollConnected || 0) > 0 ? 'healthy' : 
        (payrollError || 0) > 0 ? 'issues' : 'not_configured';

      const pandaDocStatus: IntegrationStat['status'] = 
        (recentPandaDocCount || 0) > 0 ? 'healthy' : 
        (pandaDocCount || 0) > 0 ? 'issues' : 'not_configured';

      const integrations: IntegrationStat[] = [
        {
          id: 'phorest',
          name: 'Phorest',
          icon: Barcode,
          connectedCount: phorestActiveCount || 0,
          status: phorestStatus,
          details: phorestStatus === 'healthy' 
            ? `${phorestActiveCount} active mapping${(phorestActiveCount || 0) !== 1 ? 's' : ''}`
            : phorestStatus === 'issues' 
            ? 'Inactive mappings' 
            : 'Not configured',
        },
        {
          id: 'payroll',
          name: 'Payroll',
          icon: DollarSign,
          connectedCount: payrollConnected || 0,
          status: payrollStatus,
          details: payrollStatus === 'healthy' 
            ? `${payrollConnected} connected`
            : payrollStatus === 'issues' 
            ? 'Connection errors' 
            : 'Not configured',
        },
        {
          id: 'pandadoc',
          name: 'PandaDoc',
          icon: FileText,
          connectedCount: pandaDocCount || 0,
          status: pandaDocStatus,
          details: pandaDocStatus === 'healthy' 
            ? `${pandaDocCount} document${(pandaDocCount || 0) !== 1 ? 's' : ''}`
            : pandaDocStatus === 'issues' 
            ? 'No recent activity' 
            : 'Not configured',
        },
      ];

      const totalActive = integrations.filter(i => i.status === 'healthy').length;

      return {
        integrations,
        totalActive,
        totalAvailable: integrations.length,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
