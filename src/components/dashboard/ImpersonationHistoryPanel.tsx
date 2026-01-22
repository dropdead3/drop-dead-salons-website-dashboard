import { format, formatDistanceToNow } from 'date-fns';
import { useImpersonationLogs, ImpersonationLogWithAdmin } from '@/hooks/useImpersonationLogs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff, Users, UserCheck, RefreshCw } from 'lucide-react';

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
  start_role: { label: 'Started Role View', icon: <Eye className="h-3 w-3" />, variant: 'default' },
  start_user: { label: 'Started User View', icon: <UserCheck className="h-3 w-3" />, variant: 'default' },
  switch_role: { label: 'Switched Role', icon: <RefreshCw className="h-3 w-3" />, variant: 'secondary' },
  switch_user: { label: 'Switched User', icon: <Users className="h-3 w-3" />, variant: 'secondary' },
  end: { label: 'Ended Session', icon: <EyeOff className="h-3 w-3" />, variant: 'outline' },
};

function LogEntry({ log }: { log: ImpersonationLogWithAdmin }) {
  const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.end;
  const initials = log.admin_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';
  
  const targetDisplay = log.target_user_name 
    ? log.target_user_name 
    : log.target_role 
      ? log.target_role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
      : null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={log.admin_photo || undefined} alt={log.admin_name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{log.admin_name}</span>
          <Badge variant={config.variant} className="gap-1 text-xs">
            {config.icon}
            {config.label}
          </Badge>
        </div>
        
        {targetDisplay && (
          <p className="text-sm text-muted-foreground">
            {log.action === 'end' ? 'Ended session' : `Viewing as ${targetDisplay}`}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          <span className="mx-1">•</span>
          {format(new Date(log.created_at), 'MMM d, h:mm a')}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ImpersonationHistoryPanelProps {
  limit?: number;
  className?: string;
}

export function ImpersonationHistoryPanel({ limit = 50, className }: ImpersonationHistoryPanelProps) {
  const { data: logs, isLoading, error } = useImpersonationLogs(limit);

  if (isLoading) {
    return (
      <div className={className}>
        <h3 className="text-lg font-medium mb-4">Impersonation History</h3>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <h3 className="text-lg font-medium mb-4">Impersonation History</h3>
        <p className="text-sm text-muted-foreground">Failed to load history</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-lg font-medium mb-4">Impersonation History</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No impersonation activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Impersonation History</h3>
        <Badge variant="secondary" className="text-xs">
          {logs.length} events
        </Badge>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {logs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
