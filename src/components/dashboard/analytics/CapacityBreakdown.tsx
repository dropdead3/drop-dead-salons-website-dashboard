import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calculator, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CapacityBreakdownProps {
  grossHoursPerStylist: number;
  breakMinutes: number;
  lunchMinutes: number;
  paddingMinutes: number;
  stylistCount: number;
  daysInPeriod: number;
  className?: string;
}

export function CapacityBreakdown({
  grossHoursPerStylist: initialGrossHours,
  breakMinutes: initialBreakMinutes,
  lunchMinutes: initialLunchMinutes,
  paddingMinutes: initialPaddingMinutes,
  stylistCount: initialStylistCount,
  daysInPeriod,
  className,
}: CapacityBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Editable state
  const [grossHours, setGrossHours] = useState(initialGrossHours);
  const [stylistCount, setStylistCount] = useState(initialStylistCount);
  const [breakMinutes, setBreakMinutes] = useState(initialBreakMinutes);
  const [lunchMinutes, setLunchMinutes] = useState(initialLunchMinutes);
  const [paddingMinutes, setPaddingMinutes] = useState(initialPaddingMinutes);

  // Update local state when props change
  useEffect(() => {
    setGrossHours(initialGrossHours);
    setStylistCount(initialStylistCount);
    setBreakMinutes(initialBreakMinutes);
    setLunchMinutes(initialLunchMinutes);
    setPaddingMinutes(initialPaddingMinutes);
  }, [initialGrossHours, initialStylistCount, initialBreakMinutes, initialLunchMinutes, initialPaddingMinutes]);

  // Calculations
  const breakHoursPerDay = (breakMinutes / 60) * stylistCount;
  const lunchHoursPerDay = (lunchMinutes / 60) * stylistCount;
  const grossHoursPerDay = grossHours * stylistCount;
  const netHoursPerDay = grossHoursPerDay - breakHoursPerDay - lunchHoursPerDay;
  
  const totalNetHours = netHoursPerDay * daysInPeriod;

  // Calculate padding impact (as percentage of booking time)
  const avgAppointmentMinutes = 60;
  const paddingImpact = paddingMinutes > 0 
    ? Math.round((paddingMinutes / (avgAppointmentMinutes + paddingMinutes)) * 100)
    : 0;

  const hasChanges = 
    grossHours !== initialGrossHours ||
    stylistCount !== initialStylistCount ||
    breakMinutes !== initialBreakMinutes ||
    lunchMinutes !== initialLunchMinutes ||
    paddingMinutes !== initialPaddingMinutes;

  const handleReset = () => {
    setGrossHours(initialGrossHours);
    setStylistCount(initialStylistCount);
    setBreakMinutes(initialBreakMinutes);
    setLunchMinutes(initialLunchMinutes);
    setPaddingMinutes(initialPaddingMinutes);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('', className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-between h-9 px-3 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calculator className="w-3.5 h-3.5" />
            <span>How is capacity calculated?</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="bg-muted/30 rounded-lg p-3 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-medium text-foreground">Daily Capacity Calculator</div>
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
          
          {/* Operating Hours × Stylists */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Operating Hours × Stylists</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={24}
                value={grossHours}
                onChange={(e) => setGrossHours(Math.max(1, Math.min(24, Number(e.target.value) || 0)))}
                className="w-14 h-7 text-xs text-center px-1 tabular-nums"
              />
              <span className="text-muted-foreground">h ×</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={stylistCount}
                onChange={(e) => setStylistCount(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
                className="w-14 h-7 text-xs text-center px-1 tabular-nums"
              />
              <span className="text-muted-foreground">=</span>
              <span className="font-medium tabular-nums w-12 text-right">{grossHoursPerDay}h</span>
            </div>
          </div>
          
          {/* Break deduction */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Less Breaks (min/stylist)</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={120}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                className="w-14 h-7 text-xs text-center px-1 tabular-nums"
              />
              <span className="text-muted-foreground">min</span>
              <span className="tabular-nums w-12 text-right text-muted-foreground">
                −{breakHoursPerDay.toFixed(1)}h
              </span>
            </div>
          </div>
          
          {/* Lunch deduction */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Less Lunch (min/stylist)</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={120}
                value={lunchMinutes}
                onChange={(e) => setLunchMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                className="w-14 h-7 text-xs text-center px-1 tabular-nums"
              />
              <span className="text-muted-foreground">min</span>
              <span className="tabular-nums w-12 text-right text-muted-foreground">
                −{lunchHoursPerDay.toFixed(1)}h
              </span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-border/50 my-1" />
          
          {/* Net hours */}
          <div className="flex items-center justify-between font-medium">
            <span className="text-foreground">Net Available Hours</span>
            <span className="text-primary tabular-nums text-sm">{netHoursPerDay.toFixed(1)}h/day</span>
          </div>

          {/* Period total */}
          {daysInPeriod > 1 && (
            <div className="flex items-center justify-between text-muted-foreground pt-1">
              <span>Total for {daysInPeriod} days</span>
              <span className="tabular-nums font-medium">{Math.round(totalNetHours)}h</span>
            </div>
          )}

          {/* Padding section */}
          <div className="border-t border-border/50 pt-2 mt-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Appt Padding (min between)</span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={paddingMinutes}
                  onChange={(e) => setPaddingMinutes(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                  className="w-14 h-7 text-xs text-center px-1 tabular-nums"
                />
                <span className="text-muted-foreground">min</span>
              </div>
            </div>
            {paddingMinutes > 0 && (
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Reduces effective booking time by ~{paddingImpact}% for 1-hour appointments.
                </span>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
