import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getPresetPeriods } from '@/hooks/useComparisonData';

interface Period {
  dateFrom: string;
  dateTo: string;
}

interface PeriodSelectorProps {
  periodA: Period;
  periodB: Period;
  onPeriodsChange: (periodA: Period, periodB: Period) => void;
  mode: 'time' | 'location' | 'category' | 'yoy';
}

const presets = [
  { value: 'thisMonth-lastMonth', label: 'This Month vs Last Month' },
  { value: 'thisWeek-lastWeek', label: 'This Week vs Last Week' },
  { value: 'thisYear-lastYear', label: 'This Year vs Last Year' },
  { value: 'q1-q1LastYear', label: 'Q1 vs Q1 Last Year' },
  { value: 'custom', label: 'Custom Ranges' },
];

export function PeriodSelector({ periodA, periodB, onPeriodsChange, mode }: PeriodSelectorProps) {
  const [preset, setPreset] = useState('thisMonth-lastMonth');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (preset !== 'custom') {
      const periods = getPresetPeriods(preset);
      onPeriodsChange(periods.periodA, periods.periodB);
      setIsCustom(false);
    } else {
      setIsCustom(true);
    }
  }, [preset]);

  // For YoY mode, lock to year comparison
  useEffect(() => {
    if (mode === 'yoy') {
      setPreset('thisYear-lastYear');
    }
  }, [mode]);

  const handleDateChange = (period: 'A' | 'B', field: 'dateFrom' | 'dateTo', date: Date | undefined) => {
    if (!date) return;
    const formatted = format(date, 'yyyy-MM-dd');
    if (period === 'A') {
      onPeriodsChange(
        { ...periodA, [field]: formatted },
        periodB
      );
    } else {
      onPeriodsChange(
        periodA,
        { ...periodB, [field]: formatted }
      );
    }
  };

  // For location/category mode, only show single period selector
  const showSinglePeriod = mode === 'location';

  return (
    <div className="space-y-4">
      {/* Preset Selector */}
      {!showSinglePeriod && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Quick select:</span>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Period Cards */}
      <div className={cn(
        'grid gap-4',
        showSinglePeriod ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 md:grid-cols-2'
      )}>
        {/* Period A */}
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-primary">Period A</span>
            {!showSinglePeriod && (
              <span className="text-xs text-muted-foreground">Current</span>
            )}
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodA.dateFrom ? format(new Date(periodA.dateFrom), 'MMM d, yyyy') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodA.dateFrom ? new Date(periodA.dateFrom) : undefined}
                  onSelect={(date) => handleDateChange('A', 'dateFrom', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground self-center">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodA.dateTo ? format(new Date(periodA.dateTo), 'MMM d, yyyy') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodA.dateTo ? new Date(periodA.dateTo) : undefined}
                  onSelect={(date) => handleDateChange('A', 'dateTo', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Period B - Hidden for location mode */}
        {!showSinglePeriod && (
          <>
            <div className="hidden md:flex items-center justify-center">
              <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                VS
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border md:col-start-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Period B</span>
                <span className="text-xs text-muted-foreground">Previous</span>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodB.dateFrom ? format(new Date(periodB.dateFrom), 'MMM d, yyyy') : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={periodB.dateFrom ? new Date(periodB.dateFrom) : undefined}
                      onSelect={(date) => handleDateChange('B', 'dateFrom', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground self-center">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodB.dateTo ? format(new Date(periodB.dateTo), 'MMM d, yyyy') : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={periodB.dateTo ? new Date(periodB.dateTo) : undefined}
                      onSelect={(date) => handleDateChange('B', 'dateTo', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
