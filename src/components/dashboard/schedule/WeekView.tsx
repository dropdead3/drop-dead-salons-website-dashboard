import { useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isToday,
  isSameDay 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Phone, User } from 'lucide-react';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';

interface WeekViewProps {
  currentDate: Date;
  appointments: PhorestAppointment[];
  hoursStart?: number;
  hoursEnd?: number;
  onAppointmentClick: (appointment: PhorestAppointment) => void;
  onSlotClick?: (date: Date, time: string) => void;
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
  const top = (startOffset / 60) * 60;
  const height = Math.max((duration / 60) * 60, 24);
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
            'absolute left-0.5 right-0.5 rounded-md border-l-4 px-1.5 py-0.5 cursor-pointer transition-all hover:shadow-md hover:z-10 overflow-hidden text-[11px]',
            statusColors.bg,
            statusColors.border,
            statusColors.text,
            appointment.status === 'cancelled' && 'opacity-60'
          )}
          style={style}
          onClick={onClick}
        >
          {isCompact ? (
            <div className="font-medium truncate">{appointment.client_name}</div>
          ) : (
            <>
              <div className="font-semibold truncate">{appointment.client_name}</div>
              <div className="opacity-80 truncate">{appointment.service_name}</div>
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
          {appointment.stylist_profile && (
            <div className="text-sm flex items-center gap-1">
              <User className="h-3 w-3" />
              {appointment.stylist_profile.display_name || appointment.stylist_profile.full_name}
            </div>
          )}
          <Badge variant="outline" className={cn('text-xs', statusColors.bg, statusColors.text)}>
            {appointment.status.replace('_', ' ')}
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function WeekView({
  currentDate,
  appointments,
  hoursStart = 8,
  hoursEnd = 20,
  onAppointmentClick,
  onSlotClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  
  const hours = useMemo(() => 
    Array.from({ length: hoursEnd - hoursStart }, (_, i) => hoursStart + i),
    [hoursStart, hoursEnd]
  );

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, PhorestAppointment[]>();
    weekDays.forEach(day => map.set(format(day, 'yyyy-MM-dd'), []));
    
    appointments.forEach(apt => {
      const dateKey = apt.appointment_date;
      if (map.has(dateKey)) {
        map.get(dateKey)!.push(apt);
      }
    });
    
    return map;
  }, [appointments, weekDays]);

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  // Current time indicator
  const now = new Date();
  const todayInWeek = weekDays.find(d => isToday(d));
  const showCurrentTime = !!todayInWeek;
  const currentTimeOffset = showCurrentTime
    ? ((now.getHours() * 60 + now.getMinutes()) - (hoursStart * 60)) / 60 * 60
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto border border-border rounded-xl bg-card shadow-sm">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30 sticky top-0 z-10">
            <div className="p-3" /> {/* Time column spacer */}
            {weekDays.map((day) => (
              <div 
                key={day.toISOString()} 
                className={cn(
                  'py-3 px-2 text-center border-l border-border',
                  isToday(day) && 'bg-primary/5'
                )}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  'text-xl font-semibold mt-0.5',
                  isToday(day) && 'text-primary'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {appointmentsByDate.get(format(day, 'yyyy-MM-dd'))?.length || 0} appts
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {/* Time Labels */}
            <div className="relative bg-muted/20">
              {hours.map((hour, index) => (
                <div 
                  key={hour} 
                  className="h-[60px] border-b border-border/50 text-xs text-muted-foreground pr-3 text-right flex items-start justify-end font-medium"
                  style={{ paddingTop: index === 0 ? '4px' : '0' }}
                >
                  <span className="relative -top-2">{formatHour(hour)}</span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate.get(dateKey) || [];
              const isCurrentDay = isToday(day);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    'relative border-l border-border',
                    isCurrentDay && 'bg-primary/5'
                  )}
                >
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-[60px] border-b border-dashed border-border/40 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => onSlotClick?.(day, `${hour.toString().padStart(2, '0')}:00`)}
                    />
                  ))}
                  
                  {/* Appointments */}
                  {dayAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      hoursStart={hoursStart}
                      onClick={() => onAppointmentClick(apt)}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isCurrentDay && currentTimeOffset > 0 && currentTimeOffset < hours.length * 60 && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none z-20"
                      style={{ top: `${currentTimeOffset}px` }}
                    >
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
