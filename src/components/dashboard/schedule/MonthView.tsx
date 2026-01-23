import { useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';
import { useCalendarTheme, type CalendarThemeSettings } from '@/hooks/useCalendarTheme';

interface MonthViewProps {
  currentDate: Date;
  appointments: PhorestAppointment[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: PhorestAppointment) => void;
}

const STATUS_DOT_COLORS: Record<AppointmentStatus, string> = {
  booked: 'bg-slate-400',
  confirmed: 'bg-green-500',
  checked_in: 'bg-blue-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-gray-300',
  no_show: 'bg-red-500',
};

export function MonthView({
  currentDate,
  appointments,
  onDayClick,
  onAppointmentClick,
}: MonthViewProps) {
  const { theme } = useCalendarTheme();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate all days in the calendar view
  const days = useMemo(() => {
    const result: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [calendarStart, calendarEnd]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, PhorestAppointment[]>();
    appointments.forEach(apt => {
      const dateKey = apt.appointment_date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(apt);
    });
    return map;
  }, [appointments]);

  // Split days into weeks
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full rounded-lg border overflow-hidden" style={{ backgroundColor: theme.calendar_bg_color }}>
      {/* Month Header */}
      <div 
        className="px-4 py-3 text-center font-medium"
        style={{ 
          backgroundColor: theme.header_bg_color, 
          color: theme.header_text_color 
        }}
      >
        {format(currentDate, 'MMMM yyyy')}
      </div>
      
      {/* Weekday Headers */}
      <div 
        className="grid grid-cols-7"
        style={{ 
          backgroundColor: theme.days_row_bg_color,
          borderBottom: `${theme.cell_border_width}px ${theme.cell_border_style} ${theme.cell_border_color}`
        }}
      >
        {weekDayHeaders.map((day, i) => {
          const dayOfWeek = new Date().getDay();
          const isCurrentDayOfWeek = i === dayOfWeek;
          return (
            <div 
              key={day} 
              className="p-2 text-center text-sm font-medium"
              style={{ 
                color: isCurrentDayOfWeek ? theme.today_highlight_color : theme.days_row_text_color 
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fill,minmax(100px,1fr))]">
        {weeks.map((week, weekIdx) => (
          <div 
            key={weekIdx} 
            className="grid grid-cols-7"
            style={{
              borderBottom: weekIdx < weeks.length - 1 ? `${theme.cell_border_width}px ${theme.cell_border_style} ${theme.cell_border_color}` : undefined
            }}
          >
            {week.map((day, dayIdx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              
              // Count by status for the dots
              const statusCounts = dayAppointments.reduce((acc, apt) => {
                acc[apt.status] = (acc[apt.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return (
                <div
                  key={day.toISOString()}
                  className="min-h-[100px] p-1.5 cursor-pointer hover:opacity-80 transition-colors"
                  style={{
                    backgroundColor: !isCurrentMonth 
                      ? theme.outside_month_bg_color 
                      : isCurrentDay 
                        ? `${theme.today_highlight_color}15` 
                        : theme.calendar_bg_color,
                    borderRight: dayIdx < 6 ? `${theme.cell_border_width}px ${theme.cell_border_style} ${theme.cell_border_color}` : undefined,
                    opacity: !isCurrentMonth ? 0.6 : 1,
                  }}
                  onClick={() => onDayClick(day)}
                >
                  {/* Day Number */}
                  <div 
                    className={cn(
                      'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full'
                    )}
                    style={isCurrentDay ? { 
                      backgroundColor: theme.today_badge_bg_color, 
                      color: theme.today_badge_text_color 
                    } : undefined}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Appointment Indicators */}
                  {dayAppointments.length > 0 && (
                    <div className="space-y-0.5">
                      {/* Show up to 3 appointments */}
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                            STATUS_DOT_COLORS[apt.status].replace('bg-', 'bg-opacity-20 bg-'),
                            'border-l-2',
                            apt.status === 'confirmed' && 'border-l-green-500 bg-green-50',
                            apt.status === 'booked' && 'border-l-slate-400 bg-slate-50',
                            apt.status === 'checked_in' && 'border-l-blue-500 bg-blue-50',
                            apt.status === 'completed' && 'border-l-purple-500 bg-purple-50',
                            apt.status === 'cancelled' && 'border-l-gray-300 bg-gray-50 opacity-60',
                            apt.status === 'no_show' && 'border-l-red-500 bg-red-50',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                        >
                          {apt.client_name}
                        </div>
                      ))}
                      
                      {/* Show "+X more" if there are more */}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1.5">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status dots summary */}
                  {dayAppointments.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap">
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className={cn('w-2 h-2 rounded-full', STATUS_DOT_COLORS[status as AppointmentStatus])}
                          title={`${count} ${status.replace('_', ' ')}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
