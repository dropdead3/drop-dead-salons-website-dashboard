import { format, addDays } from 'date-fns';

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  reminder?: boolean;
}

/**
 * Generate ICS calendar file content for the 75-day program
 */
export function generateProgramCalendar(
  startDate: Date,
  programName: string = 'DD75: Client Engine',
  totalDays: number = 75
): string {
  const events: CalendarEvent[] = [];

  // Add daily reminder events
  for (let day = 1; day <= totalDays; day++) {
    const eventDate = addDays(startDate, day - 1);
    
    // Daily task reminder
    events.push({
      title: `${programName} - Day ${day}`,
      description: `Complete your daily tasks:\n- Post content\n- Respond to DMs\n- Follow up with clients\n- Log metrics\n- Upload proof`,
      startDate: setTime(eventDate, 9, 0), // 9 AM
      endDate: setTime(eventDate, 9, 30),
      reminder: true,
    });

    // Weekly wins reminder (every 7 days)
    if (day % 7 === 0) {
      events.push({
        title: `${programName} - Week ${day / 7} Review`,
        description: `Time to submit your Weekly Wins Report!\nReflect on your progress and celebrate your wins from this week.`,
        startDate: setTime(eventDate, 18, 0), // 6 PM
        endDate: setTime(eventDate, 18, 30),
        reminder: true,
      });
    }
  }

  // Add completion celebration
  const completionDate = addDays(startDate, totalDays);
  events.push({
    title: `🎉 ${programName} - GRADUATION DAY!`,
    description: `Congratulations! You've completed the 75-day Client Engine Program!\nYou've built unbreakable habits and transformed your book.`,
    startDate: setTime(completionDate, 10, 0),
    endDate: setTime(completionDate, 11, 0),
  });

  return generateICS(events);
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@dd75`;
}

function generateICS(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DD75 Client Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:DD75 Client Engine Program',
    'X-WR-TIMEZONE:America/Los_Angeles',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${generateUID()}`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(event.startDate)}`);
    lines.push(`DTEND:${formatICSDate(event.endDate)}`);
    lines.push(`SUMMARY:${escapeICSText(event.title)}`);
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    
    if (event.reminder) {
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT30M');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeICSText(event.title)}`);
      lines.push('END:VALARM');
    }
    
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Trigger download of ICS file
 */
export function downloadCalendar(
  startDate: Date,
  programName?: string,
  totalDays?: number
): void {
  const icsContent = generateProgramCalendar(startDate, programName, totalDays);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dd75-client-engine-schedule.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(
  title: string,
  startDate: Date,
  endDate: Date,
  description: string
): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`,
    details: description,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
