import { Card } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { useTodaysQueue } from '@/hooks/useTodaysQueue';
import { Skeleton } from '@/components/ui/skeleton';

interface OperationsQuickStatsProps {
  locationId?: string;
  hideRevenue?: boolean;
}

export function OperationsQuickStats({ locationId, hideRevenue }: OperationsQuickStatsProps) {
  const { data: queueData, isLoading } = useTodaysQueue(locationId);

  const stats = [
    {
      label: 'Waiting',
      value: queueData?.stats.waitingCount ?? 0,
      icon: Users,
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      description: 'Confirmed, ready to check in',
    },
    {
      label: 'In Service',
      value: queueData?.stats.inServiceCount ?? 0,
      icon: Clock,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      description: 'Currently checked in',
    },
    {
      label: 'Completed',
      value: queueData?.stats.completedCount ?? 0,
      icon: CheckCircle2,
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-600',
      description: 'Paid and finished',
    },
    {
      label: 'No-Shows',
      value: queueData?.stats.noShowCount ?? 0,
      icon: AlertTriangle,
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-600',
      description: 'Missed appointments',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-sm tracking-wide">TODAY'S OPERATIONS</h2>
      <div className={`grid grid-cols-2 ${hideRevenue ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4`}>
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bgColor} flex items-center justify-center rounded`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-sans">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
        
        {/* Revenue Card - Hidden for Front Desk */}
        {!hideRevenue && (
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/10 flex items-center justify-center rounded">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-green-700 dark:text-green-400">
                  ${queueData?.stats.totalRevenue?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-500 font-sans">Today's Revenue</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
