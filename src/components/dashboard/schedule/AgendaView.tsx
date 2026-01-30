import { useMemo } from 'react';
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';

interface AgendaViewProps {
  currentDate: Date;
  appointments: PhorestAppointment[];
  onAppointmentClick: (appointment: PhorestAppointment) => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { bg: string; text: string; label: string }> = {
  booked: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Booked' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
  checked_in: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked In' },
  completed: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
  no_show: { bg: 'bg-red-100', text: 'text-red-800', label: 'No Show' },
};

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

function AppointmentCard({ 
  appointment, 
  onClick 
}: { 
  appointment: PhorestAppointment; 
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[appointment.status];
  const isCancelledOrNoShow = appointment.status === 'cancelled' || appointment.status === 'no_show';

  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isCancelledOrNoShow && 'opacity-60'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Time Column */}
          <div className="text-center shrink-0 w-16">
            <div className="text-lg font-medium">
              {formatTime12h(appointment.start_time).replace(' ', '')}
            </div>
            <div className="text-xs text-muted-foreground">
              to {formatTime12h(appointment.end_time).replace(' ', '')}
            </div>
          </div>

          {/* Divider */}
          <div className={cn(
            'w-1 self-stretch rounded-full',
            statusConfig.bg
          )} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-base">{appointment.client_name}</h4>
                <p className="text-sm text-muted-foreground">{appointment.service_name}</p>
              </div>
              <Badge className={cn('shrink-0', statusConfig.bg, statusConfig.text)}>
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {appointment.client_phone && (
                <a 
                  href={`tel:${appointment.client_phone}`}
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {appointment.client_phone}
                </a>
              )}
              
              {appointment.stylist_profile && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={appointment.stylist_profile.photo_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {(appointment.stylist_profile.display_name || appointment.stylist_profile.full_name).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {appointment.stylist_profile.display_name || appointment.stylist_profile.full_name}
                </div>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AgendaView({
  currentDate,
  appointments,
  onAppointmentClick,
}: AgendaViewProps) {
  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, PhorestAppointment[]>();
    
    // Sort appointments by date and time
    const sorted = [...appointments].sort((a, b) => {
      const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    sorted.forEach(apt => {
      const dateKey = apt.appointment_date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(apt);
    });
    
    return map;
  }, [appointments]);

  // Get sorted dates
  const dates = useMemo(() => 
    Array.from(appointmentsByDate.keys()).sort(),
    [appointmentsByDate]
  );

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium mb-1">No appointments scheduled</h3>
        <p className="text-muted-foreground">
          There are no appointments in this time period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {dates.map((dateStr) => {
        const dayAppointments = appointmentsByDate.get(dateStr) || [];
        const date = parseISO(dateStr);
        const dateLabel = getDateLabel(dateStr);

        return (
          <div key={dateStr}>
            {/* Date Header */}
            <div className={cn(
              'sticky top-0 z-10 py-2 px-1 mb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
              isToday(date) && 'border-l-4 border-l-primary pl-3'
            )}>
              <h3 className="font-semibold text-lg">{dateLabel}</h3>
              <p className="text-sm text-muted-foreground">
                {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Appointments List */}
            <div className="space-y-3">
              {dayAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onClick={() => onAppointmentClick(apt)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
