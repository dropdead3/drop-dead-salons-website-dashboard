import { useState } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { CalendarView } from '@/hooks/usePhorestCalendar';

interface ScheduleHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  selectedStaff: string;
  onStaffChange: (staff: string) => void;
  stylists: Array<{ user_id: string; display_name: string | null; full_name: string }>;
  onNewBooking: () => void;
  canCreate?: boolean;
}

export function ScheduleHeader({
  currentDate,
  setCurrentDate,
  view,
  setView,
  selectedStaff,
  onStaffChange,
  stylists,
  onNewBooking,
  canCreate = false,
}: ScheduleHeaderProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Get quick day buttons (next 7 days starting from current week)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const quickDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevDay = () => setCurrentDate(addDays(currentDate, -1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToPrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  return (
    <div className="flex flex-col">
      {/* Dark Header Bar */}
      <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between rounded-t-lg">
        {/* Left: Staff Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedStaff} onValueChange={onStaffChange}>
            <SelectTrigger className="w-[160px] bg-background/10 border-background/20 text-background hover:bg-background/20">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {stylists.map((s) => (
                <SelectItem key={s.user_id} value={s.user_id}>
                  {s.display_name || s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-background/70 hover:text-background hover:bg-background/10"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Date Display */}
        <div className="text-center">
          <div className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
          {isToday(currentDate) && (
            <div className="text-xs text-background/70">Today</div>
          )}
        </div>

        {/* Right: View Toggle & Date Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-background/60" />
            <div className="flex rounded-full overflow-hidden border border-background/40">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-6 py-1.5 rounded-full text-background/70 hover:text-background hover:bg-background/10 transition-all',
                  view === 'day' && 'bg-background text-foreground hover:bg-background hover:text-foreground font-medium'
                )}
                onClick={() => setView('day')}
              >
                Day
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-6 py-1.5 rounded-full text-background/70 hover:text-background hover:bg-background/10 transition-all',
                  view === 'week' && 'bg-background text-foreground hover:bg-background hover:text-foreground font-medium'
                )}
                onClick={() => setView('week')}
              >
                Week
              </Button>
            </div>
          </div>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-background/70 hover:text-background hover:bg-background/10"
              >
                <CalendarIcon className="h-4 w-4 mr-1.5" />
                Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarPicker
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date);
                    setDatePickerOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Secondary Navigation Bar */}
      <div className="bg-card border-x border-b border-border px-4 py-2 flex items-center justify-between">
        {/* Left: Week/Day Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToPrevWeek} className="gap-1">
            <ChevronsLeft className="h-4 w-4" />
            Week
          </Button>
          <Button variant="outline" size="sm" onClick={goToPrevDay} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Day
          </Button>
        </div>

        {/* Center: Quick Day Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant={isToday(currentDate) ? 'default' : 'outline'}
            size="sm"
            onClick={goToToday}
            className={cn(
              isToday(currentDate) && 'bg-primary text-primary-foreground'
            )}
          >
            Today
          </Button>
          {quickDays.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
            const isTodayDate = isToday(day);
            return (
              <Button
                key={day.toISOString()}
                variant={isSelected && !isTodayDate ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentDate(day)}
                className={cn(
                  'min-w-[50px]',
                  isSelected && 'font-semibold',
                  isTodayDate && !isSelected && 'text-primary'
                )}
              >
                {format(day, 'EEE')}
              </Button>
            );
          })}
        </div>

        {/* Right: Forward Navigation + Jump Ahead */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToNextDay} className="gap-1">
            Day
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek} className="gap-1">
            Week
            <ChevronsRight className="h-4 w-4" />
          </Button>
          
          {/* Jump Ahead Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-1 gap-1">
                {stylists.length} <Plus className="h-3 w-3" />
                <ChevronRight className="h-3 w-3 rotate-90" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="flex flex-col">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((weeks) => {
                  const targetDate = addDays(new Date(), weeks * 7);
                  return (
                    <Button
                      key={weeks}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-auto py-2 px-3"
                      onClick={() => setCurrentDate(targetDate)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">+{weeks} Weeks</span>
                        <span className="text-xs text-muted-foreground">
                          {format(targetDate, 'EEE, MMM d, yyyy')}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
