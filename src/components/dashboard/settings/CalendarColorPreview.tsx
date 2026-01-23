import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getCategoryColor, getCategoryAbbreviation } from '@/utils/categoryColors';

interface CalendarColorPreviewProps {
  colorMap: Record<string, { bg: string; text: string; abbr: string }>;
}

// Helper to detect consultation category
const isConsultationCategory = (category: string) => {
  return category.toLowerCase().includes('consult');
};

// Consultation gradient styles - light teal to lavender purple
const CONSULTATION_GRADIENT = {
  background: 'linear-gradient(135deg, hsl(175,60%,85%) 0%, hsl(200,55%,75%) 50%, hsl(270,50%,85%) 100%)',
  textColor: '#374151',
};

// Sample appointments to showcase different categories
const SAMPLE_APPOINTMENTS = [
  // Monday
  { day: 0, start: '09:00', end: '11:00', category: 'Blonding', client: 'Sarah M.' },
  { day: 0, start: '11:30', end: '12:30', category: 'Haircuts', client: 'Emma T.' },
  { day: 0, start: '12:30', end: '13:00', category: 'Break', client: 'Lunch' },
  { day: 0, start: '14:00', end: '16:30', category: 'Extensions', client: 'Olivia K.' },
  
  // Tuesday  
  { day: 1, start: '09:00', end: '09:30', category: 'New Client Consultation', client: 'New Guest' },
  { day: 1, start: '10:00', end: '11:00', category: 'Color', client: 'Ava R.' },
  { day: 1, start: '11:30', end: '12:30', category: 'Treatment', client: 'Mia L.' },
  { day: 1, start: '13:30', end: '15:30', category: 'Blonding', client: 'Lily W.' },
  { day: 1, start: '16:00', end: '17:00', category: 'Styling', client: 'Chloe B.' },
  
  // Wednesday
  { day: 2, start: '09:00', end: '10:00', category: 'Haircuts', client: 'Grace H.' },
  { day: 2, start: '10:30', end: '13:00', category: 'Extensions', client: 'Zoe P.' },
  { day: 2, start: '14:00', end: '15:00', category: 'Color', client: 'Ella N.' },
  { day: 2, start: '15:30', end: '17:00', category: 'Treatment', client: 'Aria S.' },
  
  // Thursday
  { day: 3, start: '09:00', end: '10:30', category: 'Block', client: 'Admin Time' },
  { day: 3, start: '11:00', end: '13:30', category: 'Blonding', client: 'Nora J.' },
  { day: 3, start: '14:00', end: '15:00', category: 'Haircuts', client: 'Ivy M.' },
  { day: 3, start: '15:30', end: '17:00', category: 'Color', client: 'Stella V.' },
];

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu'];
const BLOCKED_CATEGORIES = ['Block', 'Break'];
const ROW_HEIGHT = 14; // pixels per 15-min slot

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getEventStyle(startTime: string, endTime: string, hoursStart: number): { top: string; height: string } {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const dayStartMinutes = hoursStart * 60;
  
  const topOffset = ((startMinutes - dayStartMinutes) / 15) * ROW_HEIGHT;
  const duration = endMinutes - startMinutes;
  const height = (duration / 15) * ROW_HEIGHT;
  
  return {
    top: `${topOffset}px`,
    height: `${Math.max(height, ROW_HEIGHT)}px`,
  };
}

export function CalendarColorPreview({ colorMap }: CalendarColorPreviewProps) {
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<number, typeof SAMPLE_APPOINTMENTS> = { 0: [], 1: [], 2: [], 3: [] };
    SAMPLE_APPOINTMENTS.forEach(apt => {
      grouped[apt.day].push(apt);
    });
    return grouped;
  }, []);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Frosted glass header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur-xl border-b">
        <div className="grid grid-cols-[48px_repeat(4,1fr)] divide-x divide-border/50">
          <div className="p-2" />
          {DAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                'p-2 text-center',
                index === 0 && 'bg-primary/5'
              )}
            >
              <div className="text-xs font-medium text-muted-foreground">{day}</div>
              <div className={cn(
                'text-sm font-semibold',
                index === 0 && 'text-primary'
              )}>
                {20 + index}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-[48px_repeat(4,1fr)] divide-x divide-border/30">
        {/* Time labels */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-14 flex items-start justify-end pr-2 pt-0.5"
            >
              <span className="text-[10px] text-muted-foreground font-medium">
                {hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((_, dayIndex) => (
          <div key={dayIndex} className="relative">
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-14 border-b border-border/20"
              />
            ))}

            {/* Appointments */}
            <div className="absolute inset-0 p-0.5">
              {appointmentsByDay[dayIndex]?.map((apt, aptIndex) => {
                const colors = getCategoryColor(apt.category, colorMap);
                const style = getEventStyle(apt.start, apt.end, 9);
                const duration = parseTimeToMinutes(apt.end) - parseTimeToMinutes(apt.start);
                const isShort = duration <= 60;

                const isConsultation = isConsultationCategory(apt.category);

                return (
                  <div
                    key={aptIndex}
                    className={cn(
                      'absolute left-0.5 right-0.5 rounded-sm overflow-hidden',
                      !isConsultation && 'border-l-2',
                      'shadow-sm',
                      isConsultation && 'shadow-lg'
                    )}
                    style={{
                      ...style,
                      ...(isConsultation ? {
                        background: CONSULTATION_GRADIENT.background,
                        color: CONSULTATION_GRADIENT.textColor,
                      } : {
                        backgroundColor: colors.bg,
                        borderLeftColor: colors.bg,
                        color: colors.text,
                      }),
                    }}
                  >
                    {/* Glass stroke overlay for consultation */}
                    {isConsultation && (
                      <div 
                        className="absolute inset-0 rounded-sm pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(180,140,220,0.45) 100%)',
                          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          maskComposite: 'xor',
                          WebkitMaskComposite: 'xor',
                          padding: '1px',
                        }}
                      />
                    )}
                    {/* Shimmer animation for consultation */}
                    {isConsultation && (
                      <div 
                        className="absolute inset-0 pointer-events-none animate-shimmer"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                        }}
                      />
                    )}
                    {/* X pattern for blocked entries */}
                    {BLOCKED_CATEGORIES.includes(apt.category) && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom right, 
                              transparent calc(50% - 0.5px), 
                              ${colors.text}30 calc(50% - 0.5px), 
                              ${colors.text}30 calc(50% + 0.5px), 
                              transparent calc(50% + 0.5px))`,
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom left, 
                              transparent calc(50% - 0.5px), 
                              ${colors.text}30 calc(50% - 0.5px), 
                              ${colors.text}30 calc(50% + 0.5px), 
                              transparent calc(50% + 0.5px))`,
                          }}
                        />
                      </div>
                    )}
                    <div className="p-1 h-full flex flex-col relative z-10">
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[9px] font-bold px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: isConsultation 
                              ? 'rgba(31, 41, 55, 0.15)' 
                              : `${colors.text}15`,
                          }}
                        >
                          {isConsultation ? 'NC' : colors.abbr}
                        </span>
                        {!isShort && (
                          <span className="text-[10px] font-medium truncate">
                            {apt.client}
                          </span>
                        )}
                      </div>
                      {!isShort && (
                        <span className="text-[9px] opacity-80 truncate mt-0.5">
                          {apt.category}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
