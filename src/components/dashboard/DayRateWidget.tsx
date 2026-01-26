import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Armchair, Calendar, DollarSign, Clock } from 'lucide-react';
import { useDayRateBookings } from '@/hooks/useDayRateBookings';
import { useLocations } from '@/hooks/useLocations';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

export function DayRateWidget() {
  const today = new Date();
  const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data: bookings, isLoading } = useDayRateBookings({
    startDate: weekStart,
    endDate: weekEnd,
  });

  const { data: locations } = useLocations();

  const stats = useMemo(() => {
    if (!bookings) return { today: 0, thisWeek: 0, pending: 0, revenue: 0 };

    const todayBookings = bookings.filter(b => b.booking_date === todayStr && b.status !== 'cancelled');
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => ['confirmed', 'checked_in', 'completed'].includes(b.status));
    const revenue = confirmedBookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0);

    return {
      today: todayBookings.length,
      thisWeek: bookings.filter(b => b.status !== 'cancelled').length,
      pending: pendingBookings.length,
      revenue,
    };
  }, [bookings, todayStr]);

  const todaysBookings = useMemo(() => {
    return bookings?.filter(b => b.booking_date === todayStr && b.status !== 'cancelled') || [];
  }, [bookings, todayStr]);

  const getLocationName = (locationId: string) => {
    return locations?.find(l => l.id === locationId)?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Armchair className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm tracking-wide">DAY RATE</h3>
        </div>
        <Link 
          to="/dashboard/admin/day-rate-calendar" 
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats.today}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats.thisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>

        {stats.pending > 0 && (
          <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {stats.pending} pending confirmation
            </span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600">
              Action Needed
            </Badge>
          </div>
        )}
      </div>

      {/* Today's Bookings */}
      {todaysBookings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Today's Bookings
          </p>
          {todaysBookings.slice(0, 3).map(booking => (
            <div 
              key={booking.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {booking.stylist_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{booking.stylist_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getLocationName(booking.location_id)}
                  </p>
                </div>
              </div>
              <Badge 
                variant={booking.status === 'checked_in' ? 'default' : 'secondary'}
                className="capitalize text-xs"
              >
                {booking.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
          {todaysBookings.length > 3 && (
            <p className="text-xs text-center text-muted-foreground">
              +{todaysBookings.length - 3} more
            </p>
          )}
        </div>
      )}

      {todaysBookings.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">No bookings today</p>
        </div>
      )}
    </Card>
  );
}
