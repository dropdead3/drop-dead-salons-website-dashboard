import { useMemo, useState } from 'react';
import { format, isToday, getWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock } from 'lucide-react';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';
import { useServiceCategoryColorsMap } from '@/hooks/useServiceCategoryColors';
import { getCategoryColor, SPECIAL_GRADIENTS, isGradientMarker, getGradientFromMarker } from '@/utils/categoryColors';

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
  selectedAppointmentId?: string | null;
}

// Phorest-style status colors
const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  booked: { bg: 'bg-muted', border: 'border-muted-foreground/30', text: 'text-foreground' },
  confirmed: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  checked_in: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  completed: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  cancelled: { bg: 'bg-muted/50', border: 'border-muted', text: 'text-muted-foreground' },
  no_show: { bg: 'bg-destructive', border: 'border-destructive', text: 'text-destructive-foreground' },
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getEventStyle(startTime: string, endTime: string, hoursStart: number, rowHeight: number = 16) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const startOffset = startMinutes - (hoursStart * 60);
  const duration = endMinutes - startMinutes;
  // 4 rows per hour (15 min intervals), each row is rowHeight px
  const top = (startOffset / 15) * rowHeight;
  const height = Math.max((duration / 15) * rowHeight, rowHeight);
  return { top: `${top}px`, height: `${height}px` };
}

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits; // Display raw for compact view
  }
  return phone;
}

// Categories that display the X pattern overlay
const BLOCKED_CATEGORIES = ['Block', 'Break'];

// Helper to detect consultation category
const isConsultationCategory = (category: string | null | undefined) => {
  if (!category) return false;
  return category.toLowerCase().includes('consult');
};

// Default consultation gradient (teal-lime) for fallback
const DEFAULT_CONSULTATION_GRADIENT = SPECIAL_GRADIENTS['teal-lime'];

interface AppointmentCardProps {
  appointment: PhorestAppointment;
  hoursStart: number;
  onClick: () => void;
  isSelected?: boolean;
  columnIndex?: number;
  totalOverlapping?: number;
  categoryColors: Record<string, { bg: string; text: string; abbr: string }>;
}

function AppointmentCard({ 
  appointment, 
  hoursStart,
  onClick,
  isSelected = false,
  columnIndex = 0,
  totalOverlapping = 1,
  categoryColors,
}: AppointmentCardProps) {
  const style = getEventStyle(appointment.start_time, appointment.end_time, hoursStart);
  const statusColors = STATUS_COLORS[appointment.status];
  const duration = parseTimeToMinutes(appointment.end_time) - parseTimeToMinutes(appointment.start_time);
  const isCompact = duration <= 30;

  // Get category-based color for non-status-specific appointments
  const serviceCategory = appointment.service_category;
  const catColor = getCategoryColor(serviceCategory, categoryColors);
  const useCategoryColor = appointment.status === 'booked';
  const isConsultation = isConsultationCategory(serviceCategory);

  // Check if the category has a gradient marker stored
  const storedColorHex = categoryColors[serviceCategory?.toLowerCase() || '']?.bg || '';
  const gradientFromMarker = isGradientMarker(storedColorHex) ? getGradientFromMarker(storedColorHex) : null;
  
  // Use gradient if: marker stored, OR consultation category defaults to teal-lime
  const displayGradient = gradientFromMarker || (isConsultation ? DEFAULT_CONSULTATION_GRADIENT : null);

  // Calculate width and offset for overlapping appointments
  const widthPercent = 100 / totalOverlapping;
  const leftPercent = columnIndex * widthPercent;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'absolute rounded-sm cursor-pointer transition-all overflow-hidden',
            !displayGradient && 'border-l-4',
            !useCategoryColor && !displayGradient && statusColors.bg,
            !useCategoryColor && !displayGradient && statusColors.border,
            !useCategoryColor && !displayGradient && statusColors.text,
            appointment.status === 'cancelled' && 'opacity-60 line-through',
            isSelected && 'ring-2 ring-primary ring-offset-1',
            displayGradient && 'shadow-lg'
          )}
          style={{
            ...style,
            left: `calc(${leftPercent}% + 2px)`,
            width: `calc(${widthPercent}% - 4px)`,
          ...(displayGradient ? {
            background: displayGradient.background,
            color: displayGradient.textColor,
          } : useCategoryColor && {
              backgroundColor: catColor.bg,
              color: catColor.text,
              borderLeftColor: catColor.bg,
            }),
          }}
          onClick={onClick}
        >
          {/* Glass stroke overlay for gradient */}
          {displayGradient && (
            <div 
              className="absolute inset-0 rounded-sm pointer-events-none"
              style={{
                background: displayGradient.glassStroke,
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor',
                WebkitMaskComposite: 'xor',
                padding: '1px',
              }}
            />
          )}
          {/* Shimmer animation for gradient */}
          {displayGradient && (
            <div 
              className="absolute inset-0 pointer-events-none animate-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          )}
          {/* X pattern overlay for Block/Break entries */}
          {BLOCKED_CATEGORIES.includes(appointment.service_category || '') && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom right, 
                    transparent calc(50% - 1px), 
                    ${useCategoryColor ? catColor.text : 'currentColor'}19 calc(50% - 1px), 
                    ${useCategoryColor ? catColor.text : 'currentColor'}19 calc(50% + 1px), 
                    transparent calc(50% + 1px))`,
                }}
              />
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom left, 
                    transparent calc(50% - 1px), 
                    ${useCategoryColor ? catColor.text : 'currentColor'}19 calc(50% - 1px), 
                    ${useCategoryColor ? catColor.text : 'currentColor'}19 calc(50% + 1px), 
                    transparent calc(50% + 1px))`,
                }}
              />
            </div>
          )}
          <div className="px-1.5 py-0.5 relative z-10">
            {isCompact ? (
              <div className="text-xs font-medium truncate">
                {appointment.client_name}
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold truncate flex items-center gap-1">
                  {appointment.status === 'confirmed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                  )}
                  {appointment.client_name}
                  {appointment.client_phone && (
                    <span className="font-normal opacity-80">
                      {formatPhone(appointment.client_phone)}
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-90 truncate">
                  {appointment.service_name}
                </div>
                {duration >= 60 && (
                  <div className="text-xs opacity-80 mt-0.5">
                    {formatTime12h(appointment.start_time)} - {formatTime12h(appointment.end_time)}
                  </div>
                )}
              </>
            )}
          </div>
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
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime12h(appointment.start_time)} - {formatTime12h(appointment.end_time)}
          </div>
          <Badge 
            variant="outline" 
            className={cn('text-xs capitalize', statusColors.bg, statusColors.text)}
          >
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
  hoursStart = 7,
  hoursEnd = 21,
  onAppointmentClick,
  onSlotClick,
  selectedAppointmentId,
}: DayViewProps) {
  const ROW_HEIGHT = 16; // 16px per 15-min slot
  const { colorMap: categoryColors } = useServiceCategoryColorsMap();
  
  // Generate time labels for each hour with 15-min intervals
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number }[] = [];
    for (let hour = hoursStart; hour < hoursEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  }, [hoursStart, hoursEnd]);

  const dateStr = format(date, 'yyyy-MM-dd');
  const weekNumber = getWeek(date);
  
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
    ? ((now.getHours() * 60 + now.getMinutes()) - (hoursStart * 60)) / 15 * ROW_HEIGHT
    : 0;

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  // Calculate overlapping appointments for a stylist
  const getOverlapInfo = (appointments: PhorestAppointment[], targetApt: PhorestAppointment) => {
    const targetStart = parseTimeToMinutes(targetApt.start_time);
    const targetEnd = parseTimeToMinutes(targetApt.end_time);
    
    const overlapping = appointments.filter(apt => {
      const aptStart = parseTimeToMinutes(apt.start_time);
      const aptEnd = parseTimeToMinutes(apt.end_time);
      return !(aptEnd <= targetStart || aptStart >= targetEnd);
    });

    overlapping.sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));
    const columnIndex = overlapping.findIndex(apt => apt.id === targetApt.id);
    
    return { columnIndex, totalOverlapping: overlapping.length };
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {/* Stylist Headers - Phorest dark style */}
          <div className="flex border-b sticky top-0 z-10">
            {/* Week indicator */}
            <div className="w-14 shrink-0 bg-muted/50 flex items-center justify-center text-xs text-muted-foreground font-medium border-r">
              W {weekNumber}
            </div>
            
            {stylists.map((stylist) => (
              <div 
                key={stylist.user_id} 
                className="flex-1 min-w-[160px] bg-foreground text-background p-2 flex items-center gap-2 border-r border-foreground/20 last:border-r-0"
              >
                <Avatar className="h-8 w-8 border border-background/20">
                  <AvatarImage src={stylist.photo_url || undefined} />
                  <AvatarFallback className="text-xs bg-background/20 text-background">
                    {(stylist.display_name || stylist.full_name).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">
                  {stylist.display_name || stylist.full_name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="flex relative">
            {/* Time Labels */}
            <div className="w-14 shrink-0 border-r bg-muted/30">
              {timeSlots.map(({ hour, minute }, idx) => (
                <div 
                  key={`${hour}-${minute}`}
                  className={cn(
                    'h-4 text-right pr-2 flex items-center justify-end',
                    minute === 0 && 'border-t border-border',
                    minute !== 0 && 'border-t border-dashed border-border/30'
                  )}
                >
                  {minute === 0 && (
                    <span className="text-[11px] text-muted-foreground -mt-2">
                      {formatHour(hour)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Stylist Columns */}
            {stylists.map((stylist) => {
              const stylistAppointments = appointmentsByStylist.get(stylist.user_id) || [];
              
              return (
                <div 
                  key={stylist.user_id} 
                  className="flex-1 min-w-[160px] relative border-r last:border-r-0"
                >
                  {/* Time slot backgrounds */}
                  {timeSlots.map(({ hour, minute }, idx) => {
                    // Alternate available/unavailable (gray for blocked times)
                    const isAvailable = hour >= 9 && hour < 18; // Example: 9-6 available
                    
                    return (
                      <div 
                        key={`${hour}-${minute}`}
                        className={cn(
                          'h-4',
                          minute === 0 && 'border-t border-border',
                          minute !== 0 && 'border-t border-dashed border-border/30',
                          isAvailable 
                            ? 'bg-background hover:bg-muted/30 cursor-pointer' 
                            : 'bg-muted/50'
                        )}
                        onClick={() => {
                          if (isAvailable) {
                            onSlotClick?.(stylist.user_id, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                          }
                        }}
                      />
                    );
                  })}
                  
                  {/* Appointments */}
                  {stylistAppointments.map((apt) => {
                    const { columnIndex, totalOverlapping } = getOverlapInfo(stylistAppointments, apt);
                    return (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        hoursStart={hoursStart}
                        onClick={() => onAppointmentClick(apt)}
                        isSelected={apt.id === selectedAppointmentId}
                        columnIndex={columnIndex}
                        totalOverlapping={totalOverlapping}
                        categoryColors={categoryColors}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Current Time Indicator */}
            {showCurrentTime && currentTimeOffset > 0 && currentTimeOffset < timeSlots.length * ROW_HEIGHT && (
              <div 
                className="absolute left-14 right-0 border-t-2 border-destructive pointer-events-none z-20"
                style={{ top: `${currentTimeOffset}px` }}
              >
                <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-destructive rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
