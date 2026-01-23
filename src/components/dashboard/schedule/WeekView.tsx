import { useMemo, useState } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Phone, User, Heart, Smartphone } from 'lucide-react';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';
import { QuickBookingPopover } from './QuickBookingPopover';
import { useServiceCategoryColors, getServiceColor } from '@/hooks/useServiceCategoryColors';
import type { ServiceCategoryColor } from '@/hooks/useServiceCategoryColors';

interface WeekViewProps {
  currentDate: Date;
  appointments: PhorestAppointment[];
  hoursStart?: number;
  hoursEnd?: number;
  onAppointmentClick: (appointment: PhorestAppointment) => void;
  onSlotClick?: (date: Date, time: string) => void;
}

// Phorest-style status colors
const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  booked: { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-800' },
  confirmed: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  checked_in: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  completed: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  cancelled: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-600' },
  no_show: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
};

const ROW_HEIGHT = 20; // Height per 15-minute slot
const SLOTS_PER_HOUR = 4;

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getEventStyle(startTime: string, endTime: string, hoursStart: number) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const startOffset = startMinutes - (hoursStart * 60);
  const duration = endMinutes - startMinutes;
  const top = (startOffset / 15) * ROW_HEIGHT;
  const height = Math.max((duration / 15) * ROW_HEIGHT, ROW_HEIGHT);
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
  onClick,
  serviceColor,
}: { 
  appointment: PhorestAppointment; 
  hoursStart: number;
  onClick: () => void;
  serviceColor?: { bg: string; text: string };
}) {
  const style = getEventStyle(appointment.start_time, appointment.end_time, hoursStart);
  const statusColors = STATUS_COLORS[appointment.status];
  const duration = parseTimeToMinutes(appointment.end_time) - parseTimeToMinutes(appointment.start_time);
  const isCompact = duration <= 30;
  const isMedium = duration <= 60;

  // Use service color if available, otherwise fall back to status colors
  const useServiceColors = serviceColor && appointment.status !== 'cancelled';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'absolute left-1 right-1 rounded-sm border-l-4 px-2 py-1 cursor-pointer transition-all hover:shadow-lg hover:z-20 overflow-hidden',
            !useServiceColors && statusColors.bg,
            !useServiceColors && statusColors.border,
            !useServiceColors && statusColors.text,
            appointment.status === 'cancelled' && 'opacity-50 line-through'
          )}
          style={{
            ...style,
            ...(useServiceColors ? {
              backgroundColor: serviceColor.bg,
              color: serviceColor.text,
              borderLeftColor: serviceColor.bg,
            } : {}),
          }}
          onClick={onClick}
        >
          {isCompact ? (
            <div className="text-xs font-semibold truncate">{appointment.client_name}</div>
          ) : isMedium ? (
            <>
              <div className="text-xs font-bold truncate">
                {appointment.client_name} {appointment.client_phone}
              </div>
              <div className="text-[11px] opacity-90 truncate">{appointment.service_name}</div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold truncate">
                {appointment.client_name} {appointment.client_phone}
              </div>
              <div className="text-[11px] opacity-90 truncate">{appointment.service_name}</div>
              <div className="text-[10px] opacity-80">
                {formatTime12h(appointment.start_time)} - {formatTime12h(appointment.end_time)}
              </div>
            </>
          )}
          
          {/* Action icons in bottom right */}
          {!isCompact && (
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
              <Heart className="h-3.5 w-3.5 opacity-70" />
              <Smartphone className="h-3.5 w-3.5 opacity-70" />
            </div>
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
}: WeekViewProps) {
  const [activeSlot, setActiveSlot] = useState<{ date: Date; time: string } | null>(null);
  const { data: serviceCategoryColors } = useServiceCategoryColors();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  
  // Generate all 15-minute time slots
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; label: string; isHour: boolean; isHalf: boolean }[] = [];
    for (let hour = hoursStart; hour < hoursEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const isHour = minute === 0;
        const isHalf = minute === 30;
        let label = '';
        if (isHour) {
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          label = `${hour12} ${ampm}`;
        } else if (isHalf) {
          label = '30';
        }
        slots.push({ hour, minute, label, isHour, isHalf });
      }
    }
    return slots;
  }, [hoursStart, hoursEnd]);

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

  // Current time indicator
  const now = new Date();
  const todayInWeek = weekDays.find(d => isToday(d));
  const showCurrentTime = !!todayInWeek;
  const currentTimeOffset = showCurrentTime
    ? ((now.getHours() * 60 + now.getMinutes()) - (hoursStart * 60)) / 15 * ROW_HEIGHT
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto border border-border rounded-2xl bg-card">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border bg-muted/40 sticky top-0 z-10">
            <div className="p-2" /> {/* Time column spacer */}
            {weekDays.map((day) => {
              const dayIsToday = isToday(day);
              const dateKey = format(day, 'yyyy-MM-dd');
              const apptCount = appointmentsByDate.get(dateKey)?.length || 0;
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    'py-3 px-2 text-center border-l border-border',
                    dayIsToday && 'bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'text-[10px] uppercase tracking-wider font-medium',
                    dayIsToday ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {format(day, 'EEE')}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <span className={cn(
                      'text-xl font-semibold flex items-center justify-center transition-colors',
                      dayIsToday 
                        ? 'bg-foreground text-background w-8 h-8 rounded-full' 
                        : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className={cn(
                    'text-[10px] mt-1',
                    dayIsToday ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}>
                    {dayIsToday ? 'Today' : `${apptCount} appts`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] relative">
            {/* Time Labels Column */}
            <div className="relative bg-muted/10">
              {timeSlots.map((slot, index) => (
                <div 
                  key={`${slot.hour}-${slot.minute}`}
                  className={cn(
                    'h-[20px] text-xs text-muted-foreground pr-2 text-right flex items-center justify-end',
                    slot.isHour && 'font-medium'
                  )}
                >
                  {slot.label && (
                    <span className={cn(
                      slot.isHour ? 'text-foreground' : 'text-muted-foreground/60'
                    )}>
                      {slot.label}
                    </span>
                  )}
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
                  {/* Time slot rows */}
                  {timeSlots.map((slot) => {
                    const slotTime = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
                    const isActive = activeSlot?.date.getTime() === day.getTime() && activeSlot?.time === slotTime;
                    
                    return (
                      <QuickBookingPopover
                        key={slotTime}
                        date={day}
                        time={slotTime}
                        open={isActive}
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveSlot({ date: day, time: slotTime });
                          } else {
                            setActiveSlot(null);
                          }
                        }}
                      >
                        <div 
                          className={cn(
                            'h-[20px] hover:bg-primary/10 cursor-pointer transition-colors',
                            slot.isHour 
                              ? 'border-t border-border/60' 
                              : slot.isHalf 
                                ? 'border-t border-dotted border-border/40'
                                : 'border-t border-dotted border-border/20'
                          )}
                        />
                      </QuickBookingPopover>
                    );
                  })}
                  
                  {/* Appointments */}
                  {dayAppointments.map((apt) => {
                    const serviceColor = getServiceColor(serviceCategoryColors, apt.service_category || apt.service_name);
                    return (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        hoursStart={hoursStart}
                        onClick={() => onAppointmentClick(apt)}
                        serviceColor={serviceColor}
                      />
                    );
                  })}

                  {/* Current time indicator */}
                  {isCurrentDay && currentTimeOffset > 0 && currentTimeOffset < timeSlots.length * ROW_HEIGHT && (
                    <div 
                      className="absolute left-0 right-0 pointer-events-none z-30"
                      style={{ top: `${currentTimeOffset}px` }}
                    >
                      <div className="relative">
                        <div className="absolute left-0 right-0 border-t-2 border-blue-500" />
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-blue-500 rounded-full shadow" />
                        <div className="absolute left-3 -top-2.5 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow">
                          {format(now, 'h:mm a')}
                        </div>
                      </div>
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
