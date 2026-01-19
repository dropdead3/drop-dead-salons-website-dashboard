import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useLocations } from '@/hooks/useLocations';
import { useLocationSchedules } from '@/hooks/useLocationSchedules';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WorkScheduleWidgetCompact() {
  const { data: profile } = useEmployeeProfile();
  const { data: locations } = useLocations();
  const { data: allSchedules } = useLocationSchedules();

  const userLocations = locations?.filter(loc => 
    profile?.location_ids?.includes(loc.id) || profile?.location_id === loc.id
  ) || [];

  // Get all work days across all locations
  const allWorkDays = allSchedules?.flatMap(s => s.work_days || []) || [];
  const uniqueWorkDays = [...new Set(allWorkDays)];

  // Get primary location schedule
  const primaryLocationId = userLocations[0]?.id;
  const primarySchedule = allSchedules?.find(s => s.location_id === primaryLocationId);

  if (userLocations.length === 0) {
    return (
      <Card className="p-4 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h3 className="font-display text-xs tracking-wide">MY SCHEDULE</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No locations assigned
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-blue-500" />
        <h3 className="font-display text-xs tracking-wide">MY SCHEDULE</h3>
      </div>

      {/* Location summary */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {userLocations.length === 1 
            ? userLocations[0].name 
            : `${userLocations.length} locations`}
        </span>
      </div>

      {/* Days display */}
      <div className="flex flex-wrap gap-1 mb-3">
        {DAYS_OF_WEEK.map((day) => {
          const isWorking = uniqueWorkDays.includes(day);
          return (
            <Badge
              key={day}
              variant={isWorking ? 'default' : 'outline'}
              className={cn(
                "text-[10px] px-1.5 py-0.5",
                isWorking 
                  ? "bg-primary/90 text-primary-foreground" 
                  : "text-muted-foreground/50 border-muted"
              )}
            >
              {day.charAt(0)}
            </Badge>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">
        {uniqueWorkDays.length} days per week
      </p>

      <Link to="/dashboard/profile">
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
          Manage
          <ChevronRight className="w-3 h-3" />
        </Button>
      </Link>
    </Card>
  );
}
