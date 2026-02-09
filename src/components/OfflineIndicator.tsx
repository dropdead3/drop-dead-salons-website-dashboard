import { WifiOff } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ className, showWhenOnline = false }: OfflineIndicatorProps) {
  const { isOffline, wasOffline } = useOfflineStatus();

  // Don't show anything if online and not configured to show
  if (!isOffline && !showWhenOnline) {
    return null;
  }

  if (isOffline) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-xs font-medium',
        className
      )}>
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    );
  }

  // Show "back online" briefly after reconnecting
  if (wasOffline) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-xs font-medium animate-pulse',
        className
      )}>
        <span className="h-2 w-2 bg-green-500 rounded-full" />
        <span>Back Online</span>
      </div>
    );
  }

  return null;
}
