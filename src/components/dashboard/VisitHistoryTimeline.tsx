import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientVisit } from '@/hooks/useClientVisitHistory';

interface VisitHistoryTimelineProps {
  visits: ClientVisit[];
  isLoading: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: 'text-green-600', label: 'Completed' },
  confirmed: { icon: CheckCircle, color: 'text-blue-600', label: 'Confirmed' },
  checked_in: { icon: CheckCircle, color: 'text-blue-600', label: 'Checked In' },
  booked: { icon: Calendar, color: 'text-muted-foreground', label: 'Booked' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelled' },
  no_show: { icon: AlertCircle, color: 'text-red-600', label: 'No Show' },
};

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function VisitHistoryTimeline({ visits, isLoading }: VisitHistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No visit history available</p>
      </div>
    );
  }

  // Group visits by date
  const visitsByDate = visits.reduce((acc, visit) => {
    const date = visit.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(visit);
    return acc;
  }, {} as Record<string, ClientVisit[]>);

  return (
    <div className="space-y-4">
      {Object.entries(visitsByDate).map(([date, dateVisits]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="space-y-2 ml-6 border-l-2 border-muted pl-4">
            {dateVisits.map(visit => {
              const statusConfig = STATUS_CONFIG[visit.status] || STATUS_CONFIG.booked;
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={visit.id} className={cn(
                  "p-3",
                  visit.status === 'cancelled' && "opacity-60",
                  visit.status === 'no_show' && "border-red-200 dark:border-red-900"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        visit.status === 'cancelled' && "line-through"
                      )}>
                        {visit.service_name}
                      </p>
                      {visit.service_category && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {visit.service_category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
                      <span className={cn("text-xs", statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime12h(visit.start_time)} - {formatTime12h(visit.end_time)}
                    </span>
                    {visit.stylist_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {visit.stylist_name}
                      </span>
                    )}
                    {visit.total_price !== null && visit.total_price > 0 && (
                      <span className="font-medium text-foreground">
                        ${visit.total_price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {visit.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {visit.notes}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
