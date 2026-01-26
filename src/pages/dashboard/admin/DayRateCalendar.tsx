import { DayRateCalendarView } from '@/components/dashboard/day-rate/DayRateCalendarView';

export default function DayRateCalendar() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide">DAY RATE CALENDAR</h1>
        <p className="text-muted-foreground">
          View and manage day rate chair rental bookings
        </p>
      </div>

      <DayRateCalendarView />
    </div>
  );
}
