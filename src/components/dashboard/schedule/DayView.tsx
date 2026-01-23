import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Phone } from 'lucide-react';
import type { PhorestAppointment, AppointmentStatus, STATUS_CONFIG } from '@/hooks/usePhorestCalendar';

interface DayViewProps {
  date: Date;
  appointments: PhorestAppointment[];
  stylists: Array<{
    user_id: string;
    display_name: string | null;
    full_name: string;
    photo_url: string | null;
  }>;
  hoursStart?: number;
  hoursEnd?: number;
  onAppointmentClick: (appointment: PhorestAppointment) => void;
  onSlotClick?: (stylistId: string, time: string) => void;
}

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  booked: { bg: 'bg-slate-100', border: 'border-l-slate-400', text: 'text-slate-700' },
  confirmed: { bg: 'bg-green-100', border: 'border-l-green-500', text: 'text-green-800' },
  checked_in: { bg: 'bg-blue-100', border: 'border-l-blue-500', text: 'text-blue-800' },
  completed: { bg: 'bg-purple-100', border: 'border-l-purple-500', text: 'text-purple-800' },
  cancelled: { bg: 'bg-gray-50', border: 'border-l-gray-300', text: 'text-gray-500' },
  no_show: { bg: 'bg-red-100', border: 'border-l-red-500', text: 'text-red-800' },
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getEventStyle(startTime: string, endTime: string, hoursStart: number) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const startOffset = startMinutes - (hoursStart * 60);
  const duration = endMinutes - startMinutes;
  const top = (startOffset / 60) * 64; // 64px per hour
  const height = Math.max((duration / 60) * 64, 24);
  return { top: `${top}px`, height: `${height}px` };
}

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function AppointmentCard({ 
  appointment, 
  hoursStart,
  onClick 
}: { 
  appointment: PhorestAppointment; 
  hoursStart: number;
  onClick: () => void;
}) {
  const style = getEventStyle(appointment.start_time, appointment.end_time, hoursStart);
  const statusColors = STATUS_COLORS[appointment.status];
  const duration = parseTimeToMinutes(appointment.end_time) - parseTimeToMinutes(appointment.start_time);
  const isCompact = duration <= 30;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer transition-all hover:shadow-md overflow-hidden',
            statusColors.bg,
            statusColors.border,
            statusColors.text,
            appointment.status === 'cancelled' && 'opacity-60'
          )}
          style={style}
          onClick={onClick}
        >
          {isCompact ? (
            <div className="text-xs font-medium truncate">{appointment.client_name}</div>
          ) : (
            <>
              <div className="text-xs font-semibold truncate">{appointment.client_name}</div>
              <div className="text-xs opacity-80 truncate">{appointment.service_name}</div>
              {duration > 45 && (
                <div className="text-xs opacity-70 mt-0.5">
                  {formatTime12h(appointment.start_time)} - {formatTime12h(appointment.end_time)}
                </div>
              )}
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1.5">
          <div className="font-semibold">{appointment.client_name}</div>
          {appointment.client_phone && (
            <div className="text-sm flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              <a href={`tel:${appointment.client_phone}`} className="hover:underline">
                {appointment.client_phone}
              </a>
            </div>
          )}
          <div className="text-sm">{appointment.service_name}</div>
          <div className="text-sm text-muted-foreground">
            {formatTime12h(appointment.start_time)} - {formatTime12h(appointment.end_time)}
          </div>
          <Badge variant="outline" className={cn('text-xs', statusColors.bg, statusColors.text)}>
            {appointment.status.replace('_', ' ')}
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function DayView({
  date,
  appointments,
  stylists,
  hoursStart = 8,
  hoursEnd = 20,
  onAppointmentClick,
  onSlotClick,
}: DayViewProps) {
  const hours = useMemo(() => 
    Array.from({ length: hoursEnd - hoursStart }, (_, i) => hoursStart + i),
    [hoursStart, hoursEnd]
  );

  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Group appointments by stylist
  const appointmentsByStylist = useMemo(() => {
    const map = new Map<string, PhorestAppointment[]>();
    stylists.forEach(s => map.set(s.user_id, []));
    
    appointments
      .filter(apt => apt.appointment_date === dateStr)
      .forEach(apt => {
        if (apt.stylist_user_id && map.has(apt.stylist_user_id)) {
          map.get(apt.stylist_user_id)!.push(apt);
        }
      });
    
    return map;
  }, [appointments, stylists, dateStr]);

  // Current time indicator
  const now = new Date();
  const showCurrentTime = isToday(date);
  const currentTimeOffset = showCurrentTime
    ? ((now.getHours() * 60 + now.getMinutes()) - (hoursStart * 60)) / 60 * 64
    : 0;

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with date */}
      <div className="flex items-center justify-center py-2 border-b bg-muted/30">
        <div className={cn(
          'text-center',
          isToday(date) && 'text-primary font-semibold'
        )}>
          <div className="text-sm text-muted-foreground">{format(date, 'EEEE')}</div>
          <div className="text-2xl">{format(date, 'd')}</div>
          <div className="text-sm text-muted-foreground">{format(date, 'MMMM yyyy')}</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {/* Stylist Headers */}
          <div className="flex border-b bg-card sticky top-0 z-10">
            <div className="w-16 shrink-0 border-r" /> {/* Time column spacer */}
            {stylists.map((stylist) => (
              <div 
                key={stylist.user_id} 
                className="flex-1 min-w-[140px] p-2 border-r last:border-r-0 text-center"
              >
                <Avatar className="h-10 w-10 mx-auto mb-1">
                  <AvatarImage src={stylist.photo_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(stylist.display_name || stylist.full_name).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium truncate">
                  {stylist.display_name || stylist.full_name.split(' ')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {appointmentsByStylist.get(stylist.user_id)?.length || 0} appts
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="flex relative">
            {/* Time Labels */}
            <div className="w-16 shrink-0 border-r">
              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="h-16 border-b text-xs text-muted-foreground pr-2 text-right pt-0 -mt-2"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Stylist Columns */}
            {stylists.map((stylist) => {
              const stylistAppointments = appointmentsByStylist.get(stylist.user_id) || [];
              
              return (
                <div 
                  key={stylist.user_id} 
                  className="flex-1 min-w-[140px] relative border-r last:border-r-0"
                >
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-16 border-b border-dashed border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => onSlotClick?.(stylist.user_id, `${hour.toString().padStart(2, '0')}:00`)}
                    />
                  ))}
                  
                  {/* Appointments */}
                  {stylistAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      hoursStart={hoursStart}
                      onClick={() => onAppointmentClick(apt)}
                    />
                  ))}
                </div>
              );
            })}

            {/* Current Time Indicator */}
            {showCurrentTime && currentTimeOffset > 0 && currentTimeOffset < hours.length * 64 && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none z-20"
                style={{ top: `${currentTimeOffset}px` }}
              >
                <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
