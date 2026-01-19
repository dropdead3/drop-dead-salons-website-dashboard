import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Cake, 
  ChevronLeft, 
  ChevronRight, 
  PartyPopper,
  Calendar,
  Gift
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isToday
} from 'date-fns';
import { useMonthlyBirthdays, useTodaysBirthdays, useUpcomingBirthdays } from '@/hooks/useBirthdays';
import { cn } from '@/lib/utils';

export function BirthdayCalendarCard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: monthlyBirthdays, isLoading: loadingMonthly } = useMonthlyBirthdays(currentMonth);
  const { data: todaysBirthdays, isLoading: loadingToday } = useTodaysBirthdays();
  const { data: upcomingBirthdays, isLoading: loadingUpcoming } = useUpcomingBirthdays(14);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);
  
  // Create array with empty slots for days before month starts
  const calendarDays = [
    ...Array(startDayOfWeek).fill(null),
    ...days
  ];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            Team Birthdays
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Birthdays Banner */}
        {!loadingToday && todaysBirthdays && todaysBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 border border-pink-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-sm">
                🎉 Today's Birthday{todaysBirthdays.length > 1 ? 's' : ''}!
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {todaysBirthdays.map(person => (
                <div key={person.id} className="flex items-center gap-2 bg-background/80 rounded-full pl-1 pr-3 py-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={person.photo_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(person.display_name || person.full_name)?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {person.display_name || person.full_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Month Header */}
        <div className="text-center">
          <h3 className="font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {loadingMonthly ? (
            Array(35).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))
          ) : (
            calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              
              const dayNum = day.getDate();
              const birthdaysThisDay = monthlyBirthdays?.[dayNum] || [];
              const hasBirthday = birthdaysThisDay.length > 0;
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm transition-colors",
                    isCurrentDay && "bg-primary text-primary-foreground font-bold",
                    hasBirthday && !isCurrentDay && "bg-pink-500/10 text-pink-600 font-medium",
                    !hasBirthday && !isCurrentDay && "hover:bg-muted/50"
                  )}
                  title={hasBirthday ? birthdaysThisDay.map(p => p.display_name || p.full_name).join(', ') : undefined}
                >
                  <span>{dayNum}</span>
                  {hasBirthday && (
                    <Cake className={cn(
                      "w-3 h-3 absolute bottom-0.5",
                      isCurrentDay ? "text-primary-foreground" : "text-pink-500"
                    )} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Upcoming Birthdays List */}
        {!loadingUpcoming && upcomingBirthdays && upcomingBirthdays.length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              Coming Up
            </h4>
            <div className="space-y-2">
              {upcomingBirthdays.slice(0, 5).map(person => (
                <div key={person.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={person.photo_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(person.display_name || person.full_name)?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {person.display_name || person.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(person.nextBirthday, 'MMM d')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {person.daysUntil === 0 ? 'Today!' : 
                     person.daysUntil === 1 ? 'Tomorrow' : 
                     `${person.daysUntil} days`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
