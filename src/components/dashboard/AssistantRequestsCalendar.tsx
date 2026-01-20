import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AssistantRequest } from '@/hooks/useAssistantRequests';
import { cn } from '@/lib/utils';

interface AssistantRequestsCalendarProps {
  requests: AssistantRequest[];
  onSelectRequest?: (request: AssistantRequest) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ConflictInfo {
  date: string;
  assistantId: string;
  requests: AssistantRequest[];
}

export function AssistantRequestsCalendar({ requests, onSelectRequest }: AssistantRequestsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group requests by date
  const requestsByDate = useMemo(() => {
    const grouped: Record<string, AssistantRequest[]> = {};
    requests.forEach(request => {
      const dateKey = request.request_date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(request);
    });
    return grouped;
  }, [requests]);

  // Detect conflicts: same assistant, overlapping times on same day
  const conflicts = useMemo<ConflictInfo[]>(() => {
    const conflictList: ConflictInfo[] = [];
    
    Object.entries(requestsByDate).forEach(([dateKey, dateRequests]) => {
      // Group by assistant
      const byAssistant: Record<string, AssistantRequest[]> = {};
      dateRequests.forEach(req => {
        if (req.assistant_id && req.status === 'assigned') {
          if (!byAssistant[req.assistant_id]) byAssistant[req.assistant_id] = [];
          byAssistant[req.assistant_id].push(req);
        }
      });

      // Check for overlaps
      Object.entries(byAssistant).forEach(([assistantId, assistantRequests]) => {
        if (assistantRequests.length < 2) return;
        
        // Sort by start time
        const sorted = [...assistantRequests].sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        );

        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];
          
          // Check overlap: if current end > next start
          if (current.end_time > next.start_time) {
            conflictList.push({
              date: dateKey,
              assistantId,
              requests: [current, next],
            });
          }
        }
      });
    });

    return conflictList;
  }, [requestsByDate]);

  const conflictDates = useMemo(() => 
    new Set(conflicts.map(c => c.date)),
    [conflicts]
  );

  // Requests for selected date
  const selectedDateRequests = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return (requestsByDate[dateKey] || []).sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );
  }, [selectedDate, requestsByDate]);

  const selectedDateConflicts = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return conflicts.filter(c => c.date === dateKey);
  }, [selectedDate, conflicts]);

  // Start offset for first day of month
  const startOffset = getDay(monthStart);

  const getStatusColor = (status: string, hasAccepted: boolean) => {
    if (status === 'completed') return 'bg-blue-500';
    if (status === 'cancelled') return 'bg-gray-400';
    if (status === 'pending') return 'bg-yellow-500';
    if (hasAccepted) return 'bg-green-500';
    return 'bg-amber-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Request Calendar
            </CardTitle>
            <CardDescription>
              Visual overview of scheduled requests
              {conflicts.length > 0 && (
                <span className="text-amber-600 ml-2">
                  • {conflicts.length} potential conflict{conflicts.length !== 1 ? 's' : ''}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday headers */}
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Empty cells for offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayRequests = requestsByDate[dateKey] || [];
            const hasConflict = conflictDates.has(dateKey);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const pendingCount = dayRequests.filter(r => r.status === 'pending' || (r.status === 'assigned' && !r.accepted_at)).length;
            
            return (
              <Popover key={dateKey}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-lg border text-sm relative transition-all hover:bg-muted/50",
                      isToday(day) && "ring-2 ring-primary ring-offset-1",
                      isSelected && "bg-primary/10 border-primary",
                      hasConflict && "bg-amber-50 dark:bg-amber-950/30 border-amber-300",
                      dayRequests.length === 0 && "opacity-50"
                    )}
                  >
                    <span className={cn(
                      "text-xs",
                      isToday(day) && "font-bold text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    {dayRequests.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5">
                        {dayRequests.slice(0, 4).map((req, i) => (
                          <div
                            key={req.id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              getStatusColor(req.status, !!req.accepted_at)
                            )}
                          />
                        ))}
                        {dayRequests.length > 4 && (
                          <span className="text-[8px] text-muted-foreground">+{dayRequests.length - 4}</span>
                        )}
                      </div>
                    )}
                    
                    {hasConflict && (
                      <AlertTriangle className="absolute top-0.5 right-0.5 h-3 w-3 text-amber-600" />
                    )}
                    
                    {pendingCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-yellow-500 text-white border-0"
                      >
                        {pendingCount}
                      </Badge>
                    )}
                  </button>
                </PopoverTrigger>
                
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b">
                    <h4 className="font-medium">{format(day, 'EEEE, MMMM d')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dayRequests.length} request{dayRequests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {selectedDateConflicts.length > 0 && isSelected && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border-b">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Conflict detected</span>
                      </div>
                    </div>
                  )}
                  
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-2 space-y-2">
                      {dayRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No requests
                        </p>
                      ) : (
                        dayRequests.map(request => (
                          <button
                            key={request.id}
                            onClick={() => onSelectRequest?.(request)}
                            className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                getStatusColor(request.status, !!request.accepted_at)
                              )} />
                              <span className="font-medium text-sm truncate">
                                {request.client_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{request.start_time.slice(0, 5)} - {request.end_time.slice(0, 5)}</span>
                              {request.locations?.name && (
                                <>
                                  <MapPin className="h-3 w-3 ml-1" />
                                  <span className="truncate">{request.locations.name}</span>
                                </>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Awaiting Response</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Accepted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span>Conflict (Phorest integration coming soon)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
