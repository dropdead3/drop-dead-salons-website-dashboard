import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarPlus, CalendarRange } from 'lucide-react';
import { useNewBookings } from '@/hooks/useNewBookings';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

export function NewBookingsCard() {
  const { data: newBookings, isLoading } = useNewBookings();

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded-lg">
          <CalendarPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-display text-sm tracking-wide">NEW BOOKINGS</h2>
            <p className="text-xs text-muted-foreground">Appointments created</p>
          </div>
          <CommandCenterVisibilityToggle 
            elementKey="new_bookings" 
            elementName="New Bookings" 
          />
        </div>
      </div>

      {/* Two metric tiles */}
      <div className="grid grid-cols-2 gap-4">
        {/* Booked Today */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-center mb-2">
            <CalendarPlus className="w-5 h-5 text-blue-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mx-auto" />
          ) : (
            <p className="text-2xl font-display tabular-nums">{newBookings?.bookedToday || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Booked Today</p>
            <MetricInfoTooltip description="New appointments created today (by creation date, not appointment date)." />
          </div>
        </div>

        {/* Booked in Last 7 Days */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-center mb-2">
            <CalendarRange className="w-5 h-5 text-purple-600" />
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-12 mx-auto" />
          ) : (
            <p className="text-2xl font-display tabular-nums">{newBookings?.bookedLast7Days || 0}</p>
          )}
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Booked in Last 7 Days</p>
            <MetricInfoTooltip description="New appointments created in the last 7 days (by creation date)." />
          </div>
        </div>
      </div>
    </Card>
  );
}
