import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Star, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

interface ClientInsightsCardProps {
  userId: string;
}

export function ClientInsightsCard({ userId }: ClientInsightsCardProps) {
  const today = new Date();
  const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');

  // Fetch clients from the dedicated phorest_clients table
  const { data: clients, isLoading } = useQuery({
    queryKey: ['stylist-clients-insights', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_clients')
        .select('*')
        .eq('preferred_stylist_id', userId)
        .order('total_spend', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Process client data
  const clientData = useMemo(() => {
    if (!clients || clients.length === 0) {
      return { topClients: [], atRiskClients: [], totalClients: 0, vipCount: 0 };
    }

    const today = new Date();
    
    // Identify at-risk clients (no visit in 60+ days with 2+ visits)
    const atRiskClients = clients
      .filter(c => {
        if (!c.last_visit || c.visit_count < 2) return false;
        const lastVisit = new Date(c.last_visit);
        const daysSince = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= 60;
      })
      .slice(0, 3);

    // Top clients by spend
    const topClients = clients.slice(0, 5);
    
    // VIP count from Phorest's own VIP flag
    const vipCount = clients.filter(c => c.is_vip).length;

    return { 
      topClients, 
      atRiskClients, 
      totalClients: clients.length, 
      vipCount 
    };
  }, [clients]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">Client Insights</CardTitle>
          </div>
          <Link to="/dashboard/my-clients">
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="font-display text-xl">{clientData.totalClients}</p>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <p className="font-display text-xl text-amber-700 dark:text-amber-400">{clientData.vipCount}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">VIP Clients</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <p className="font-display text-xl text-red-700 dark:text-red-400">{clientData.atRiskClients.length}</p>
            <p className="text-xs text-red-600 dark:text-red-500">At Risk</p>
          </div>
        </div>

        {/* Top Clients */}
        {clientData.topClients.length > 0 && (
          <div>
            <p className="text-xs font-display tracking-wide text-muted-foreground mb-2">TOP CLIENTS</p>
            <div className="space-y-2">
              {clientData.topClients.map((client, idx) => (
                <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-display">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      {client.is_vip && (
                        <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{client.visit_count} visits</p>
                  </div>
                  <p className="font-display text-sm">${Number(client.total_spend || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* At-Risk Alert */}
        {clientData.atRiskClients.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Clients Need Attention
              </p>
            </div>
            <div className="space-y-1">
              {clientData.atRiskClients.map(client => (
                <div key={client.id} className="flex items-center justify-between text-xs">
                  <span className="text-red-700 dark:text-red-400">{client.name}</span>
                  <span className="text-red-600 dark:text-red-500">
                    Last visit: {client.last_visit ? format(new Date(client.last_visit), 'MMM d') : 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {clientData.totalClients === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No client data available yet. Data syncs from Phorest automatically.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
