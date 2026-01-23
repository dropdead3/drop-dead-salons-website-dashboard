import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface SyncStatus {
  sync_type: string;
  status: string;
  completed_at: string | null;
}

export function PhorestSyncPopout() {
  // Fetch latest sync status for each type
  const { data: syncStatuses } = useQuery({
    queryKey: ['phorest-sync-popout-status'],
    queryFn: async () => {
      const types = ['appointments', 'sales', 'staff', 'all'];
      const statuses: Record<string, SyncStatus | null> = {};
      
      for (const type of types) {
        const { data } = await supabase
          .from('phorest_sync_log')
          .select('sync_type, status, completed_at')
          .eq('sync_type', type)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        statuses[type] = data;
      }
      
      return statuses;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Calculate overall health
  const getOverallHealth = () => {
    if (!syncStatuses) return 'unknown';
    
    const appointmentSync = syncStatuses.appointments;
    const salesSync = syncStatuses.sales;
    
    // Check if appointments synced in last 10 minutes
    if (appointmentSync?.completed_at) {
      const lastSync = new Date(appointmentSync.completed_at);
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (lastSync < tenMinsAgo) return 'stale';
    }
    
    // Check for any failures
    if (appointmentSync?.status === 'failed' || salesSync?.status === 'failed') {
      return 'error';
    }
    
    if (appointmentSync?.status === 'success') return 'healthy';
    return 'unknown';
  };

  const health = getOverallHealth();
  
  const getHealthColor = () => {
    switch (health) {
      case 'healthy':
        return 'bg-primary';
      case 'error':
        return 'bg-destructive';
      case 'stale':
        return 'bg-warning';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (status === 'success') {
      return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    }
    if (status === 'failed') {
      return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    }
    return <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const getTimeAgo = (completedAt: string | null) => {
    if (!completedAt) return 'Never';
    return formatDistanceToNow(new Date(completedAt), { addSuffix: true });
  };

  const appointmentSync = syncStatuses?.appointments;
  const salesSync = syncStatuses?.sales;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <RefreshCw className="w-4 h-4" />
              <span 
                className={cn(
                  "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  getHealthColor()
                )} 
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Phorest Sync Status</p>
        </TooltipContent>
      </Tooltip>
      
      <PopoverContent align="end" className="w-72 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-display text-xs uppercase tracking-wider text-foreground">
            Phorest Sync
          </h4>
          <Link 
            to="/dashboard/admin/phorest-settings" 
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Settings
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        {/* Sync Status List */}
        <div className="p-4 space-y-3">
          {/* Appointments */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs",
                appointmentSync?.status === 'failed' ? "text-destructive" : "text-muted-foreground"
              )}>
                {getTimeAgo(appointmentSync?.completed_at || null)}
              </span>
              {getStatusIcon(appointmentSync?.status)}
            </div>
          </div>
          
          {/* Sales */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs",
                salesSync?.status === 'failed' ? "text-destructive" : "text-muted-foreground"
              )}>
                {getTimeAgo(salesSync?.completed_at || null)}
              </span>
              {getStatusIcon(salesSync?.status)}
            </div>
          </div>
        </div>
        
        {/* Footer hint */}
        <div className="px-4 py-2 bg-muted/50 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Auto-syncs every 5 minutes
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
