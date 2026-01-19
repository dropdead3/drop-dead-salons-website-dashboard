import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, Calendar, ChevronLeft, ChevronRight, PartyPopper, Users } from 'lucide-react';
import { useMonthlyBirthdays, useUpcomingBirthdays, useTodaysBirthdays } from '@/hooks/useBirthdays';
import { format, addMonths, subMonths, getMonth, getDate, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TeamBirthdays() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { data: todaysBirthdays, isLoading: loadingToday } = useTodaysBirthdays();
  const { data: upcomingBirthdays, isLoading: loadingUpcoming } = useUpcomingBirthdays(365); // Full year
  const { data: thisMonthBirthdays, isLoading: loadingThisMonth } = useMonthlyBirthdays(currentMonth);
  
  const nextMonth = addMonths(currentMonth, 1);
  const { data: nextMonthBirthdays, isLoading: loadingNextMonth } = useMonthlyBirthdays(nextMonth);

  // Count birthdays this month
  const thisMonthCount = thisMonthBirthdays 
    ? Object.values(thisMonthBirthdays).flat().length 
    : 0;
  
  // Count birthdays next month
  const nextMonthCount = nextMonthBirthdays 
    ? Object.values(nextMonthBirthdays).flat().length 
    : 0;

  // Get next 3 upcoming (excluding today)
  const next3Upcoming = upcomingBirthdays?.filter(b => b.daysUntil > 0).slice(0, 3) || [];

  const isLoading = loadingToday || loadingUpcoming || loadingThisMonth || loadingNextMonth;

  // Calendar rendering
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = getMonth(currentMonth) === getMonth(today) && 
                         currentMonth.getFullYear() === today.getFullYear();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2 flex items-center gap-3">
            <Cake className="w-8 h-8" />
            Team Birthdays
          </h1>
          <p className="text-muted-foreground font-sans">
            Celebrate your team members' special days
          </p>
        </div>

        {/* Today's Birthdays Banner */}
        {todaysBirthdays && todaysBirthdays.length > 0 && (
          <Card className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <PartyPopper className="w-6 h-6" />
                <h2 className="font-display text-lg tracking-wide">
                  🎂 TODAY'S BIRTHDAY{todaysBirthdays.length > 1 ? 'S' : ''}!
                </h2>
              </div>
              <div className="flex flex-wrap gap-4">
                {todaysBirthdays.map((person) => (
                  <div 
                    key={person.id}
                    className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full pl-2 pr-4 py-2"
                  >
                    <Avatar className="w-10 h-10 border-2 border-white/50">
                      <AvatarImage src={person.photo_url || undefined} />
                      <AvatarFallback className="bg-white/30 text-white">
                        {(person.display_name || person.full_name)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {person.display_name || person.full_name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* This Month Count */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-display">{thisMonthCount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Birthdays in {format(currentMonth, 'MMMM')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Month Count */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-display">{nextMonthCount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Birthdays in {format(nextMonth, 'MMMM')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Team */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-display">{upcomingBirthdays?.length || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Team members with birthdays
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display tracking-wide">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }
                  
                  const hasBirthday = thisMonthBirthdays && thisMonthBirthdays[day];
                  const isToday = isCurrentMonth && day === today.getDate();
                  const birthdayPeople = hasBirthday ? thisMonthBirthdays[day] : [];
                  
                  return (
                    <div
                      key={day}
                      className={cn(
                        "aspect-square p-1 rounded-lg relative flex flex-col items-center justify-start",
                        isToday && "bg-primary/10 ring-2 ring-primary",
                        hasBirthday && !isToday && "bg-pink-50 dark:bg-pink-950/30"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        isToday && "text-primary font-bold"
                      )}>
                        {day}
                      </span>
                      {hasBirthday && (
                        <div className="flex -space-x-1 mt-1">
                          {birthdayPeople.slice(0, 3).map((person, i) => (
                            <Avatar key={person.id} className="w-5 h-5 border border-background">
                              <AvatarImage src={person.photo_url || undefined} />
                              <AvatarFallback className="text-[8px] bg-pink-200 text-pink-800">
                                {(person.display_name || person.full_name)?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {birthdayPeople.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] border border-background">
                              +{birthdayPeople.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Birthdays */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display tracking-wide text-sm">
                NEXT 3 UPCOMING
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : next3Upcoming.length > 0 ? (
                next3Upcoming.map((person) => (
                  <div 
                    key={person.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={person.photo_url || undefined} />
                      <AvatarFallback className="bg-pink-100 text-pink-800">
                        {(person.display_name || person.full_name)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {person.display_name || person.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(person.nextBirthday, 'MMMM d')}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "shrink-0",
                        person.daysUntil === 1 && "border-orange-500 text-orange-600",
                        person.daysUntil <= 3 && person.daysUntil > 1 && "border-amber-500 text-amber-600"
                      )}
                    >
                      {person.daysUntil === 1 ? 'Tomorrow' : `${person.daysUntil} days`}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming birthdays
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
