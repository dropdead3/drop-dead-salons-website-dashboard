import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isToday } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  Plus,
  LayoutGrid,
  Check,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CalendarView } from '@/hooks/usePhorestCalendar';
import { CalendarFiltersPopover, type CalendarFilterState } from './CalendarFiltersPopover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScheduleHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  selectedStaffIds: string[];
  onStaffToggle: (staffId: string) => void;
  stylists: Array<{ user_id: string; display_name: string | null; full_name: string }>;
  selectedLocation: string;
  onLocationChange: (locationId: string) => void;
  locations: Array<{ id: string; name: string }>;
  onNewBooking: () => void;
  canCreate?: boolean;
  calendarFilters: CalendarFilterState;
  onCalendarFiltersChange: (filters: CalendarFilterState) => void;
}

export function ScheduleHeader({
  currentDate,
  setCurrentDate,
  view,
  setView,
  selectedStaffIds,
  onStaffToggle,
  stylists,
  selectedLocation,
  onLocationChange,
  locations,
  onNewBooking,
  canCreate = false,
  calendarFilters,
  onCalendarFiltersChange,
}: ScheduleHeaderProps) {
  const navigate = useNavigate();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);

  // Get quick day buttons - next 7 days starting from tomorrow (today is handled by Today button)
  const today = new Date();
  const quickDays = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));

  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevDay = () => setCurrentDate(addDays(currentDate, -1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToPrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  return (
    <div className="flex flex-col">
      {/* Dark Header Bar */}
      <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between rounded-t-lg">
        {/* Left: View Toggle & Date Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-background/60" />
            <div className="relative flex rounded-full overflow-hidden border border-background/40 p-0.5">
              {/* Animated sliding pill */}
              <div 
                className={cn(
                  "absolute top-0.5 bottom-0.5 bg-background rounded-full transition-all duration-300 ease-out",
                  view === 'week' ? 'left-0.5 w-[calc(50%-2px)]' : 'left-[50%] w-[calc(50%-2px)]'
                )}
              />
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'relative z-10 px-6 py-1.5 rounded-full transition-colors duration-300 hover:bg-transparent',
                  view === 'week' 
                    ? 'text-foreground font-medium' 
                    : 'text-background/50 hover:text-background/80'
                )}
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'relative z-10 px-6 py-1.5 rounded-full transition-colors duration-300 hover:bg-transparent',
                  view === 'day' 
                    ? 'text-foreground font-medium' 
                    : 'text-background/50 hover:text-background/80'
                )}
                onClick={() => setView('day')}
              >
                Day
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
            <PopoverContent className="w-auto p-0" align="start">
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

        {/* Center: Date Display */}
        <div className="text-center">
          <div className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
          {isToday(currentDate) && (
            <div className="text-xs text-background/70">Today</div>
          )}
        </div>

        {/* Right: Filters, Location, Staff Selectors & Settings */}
        <div className="flex items-center gap-3">
          <CalendarFiltersPopover 
            filters={calendarFilters}
            onFiltersChange={onCalendarFiltersChange}
          />
          
          {/* Location Selector */}
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[140px] bg-background/10 border-background/20 text-background hover:bg-background/20">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Staff Multi-Select */}
          <Popover open={staffPopoverOpen} onOpenChange={setStaffPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-[180px] justify-between bg-background/10 border-background/20 text-background hover:bg-background/20 hover:text-background"
              >
                {selectedStaffIds.length === 0 
                  ? 'All Staff' 
                  : selectedStaffIds.length === 1
                    ? stylists.find(s => s.user_id === selectedStaffIds[0])?.display_name || 
                      stylists.find(s => s.user_id === selectedStaffIds[0])?.full_name || 
                      '1 selected'
                    : `${selectedStaffIds.length} selected`
                }
                <ChevronRight className="h-4 w-4 rotate-90 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2 bg-popover" align="end">
              <div className="space-y-1">
                <button
                  onClick={() => onStaffToggle('all')}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
                    selectedStaffIds.length === 0 && 'bg-accent'
                  )}
                >
                  {selectedStaffIds.length === 0 && <Check className="h-4 w-4" />}
                  {selectedStaffIds.length !== 0 && <div className="w-4" />}
                  All Staff
                </button>
                <div className="h-px bg-border my-1" />
                {stylists.map((s) => (
                  <button
                    key={s.user_id}
                    onClick={() => onStaffToggle(s.user_id)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                  >
                    <Checkbox 
                      checked={selectedStaffIds.includes(s.user_id)}
                      className="pointer-events-none"
                    />
                    {s.display_name || s.full_name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-background/70 hover:text-background hover:bg-background/10"
                onClick={() => navigate('/dashboard/admin/settings?category=schedule')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Schedule Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Secondary Navigation Bar */}
      <div className="bg-card border-x border-b border-border px-4 py-2 flex items-center justify-between rounded-b-lg">
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
                onClick={() => {
                  setCurrentDate(day);
                  setView('day');
                }}
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
