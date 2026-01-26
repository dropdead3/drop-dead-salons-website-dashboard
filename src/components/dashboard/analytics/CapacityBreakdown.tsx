import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Calculator, Info, RotateCcw, Settings } from 'lucide-react';
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
  
  // Editable state (hours and stylist count are read-only from location settings)
  const [breakMinutes, setBreakMinutes] = useState(initialBreakMinutes);
  const [lunchMinutes, setLunchMinutes] = useState(initialLunchMinutes);
  const [paddingMinutes, setPaddingMinutes] = useState(initialPaddingMinutes);

  // Update local state when props change
  useEffect(() => {
    setBreakMinutes(initialBreakMinutes);
    setLunchMinutes(initialLunchMinutes);
    setPaddingMinutes(initialPaddingMinutes);
  }, [initialBreakMinutes, initialLunchMinutes, initialPaddingMinutes]);

  // Calculations (use props directly for hours/stylists)
  const breakHoursPerDay = (breakMinutes / 60) * initialStylistCount;
  const lunchHoursPerDay = (lunchMinutes / 60) * initialStylistCount;
  const grossHoursPerDay = initialGrossHours * initialStylistCount;
  const netHoursPerDay = Math.max(0, grossHoursPerDay - breakHoursPerDay - lunchHoursPerDay);
  
  const totalNetHours = netHoursPerDay * daysInPeriod;

  // Calculate padding impact (as percentage of booking time)
  const avgAppointmentMinutes = 60;
  const paddingImpact = paddingMinutes > 0 
    ? Math.round((paddingMinutes / (avgAppointmentMinutes + paddingMinutes)) * 100)
    : 0;

  const hasChanges = 
    breakMinutes !== initialBreakMinutes ||
    lunchMinutes !== initialLunchMinutes ||
    paddingMinutes !== initialPaddingMinutes;

  const handleReset = () => {
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
      <CollapsibleContent className="pt-3">
        <div className="bg-muted/30 rounded-xl p-4 space-y-4 text-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="font-semibold text-foreground">Daily Capacity Calculator</div>
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>
          
          {/* Calculator Rows */}
          <div className="space-y-3">
            {/* Operating Hours × Stylists - Read Only */}
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                <span className="text-muted-foreground">Operating Hours × Stylists</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-sm">{initialGrossHours}h</span>
                  <span className="text-muted-foreground text-xs">×</span>
                  <span className="tabular-nums text-sm">{initialStylistCount}</span>
                  <span className="text-muted-foreground text-xs">=</span>
                  <span className="font-semibold tabular-nums w-14 text-right">{grossHoursPerDay}h</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/70">
                  From your location settings
                </span>
                <Link 
                  to="/dashboard/admin/settings?category=locations"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Edit Settings
                  <Settings className="w-3 h-3" />
                </Link>
              </div>
            </div>
            
            {/* Break deduction */}
            <div className="grid grid-cols-[1fr,auto] items-center gap-4">
              <span className="text-muted-foreground">Less Breaks (per stylist)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                  className="w-16 h-8 text-sm text-center tabular-nums bg-background"
                />
                <span className="text-muted-foreground text-xs w-6">min</span>
                <span className="w-16" />
                <span className="w-4" />
                <span className="tabular-nums w-14 text-right text-muted-foreground">
                  −{breakHoursPerDay.toFixed(1)}h
                </span>
              </div>
            </div>
            
            {/* Lunch deduction */}
            <div className="grid grid-cols-[1fr,auto] items-center gap-4">
              <span className="text-muted-foreground">Less Lunch (per stylist)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={lunchMinutes}
                  onChange={(e) => setLunchMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                  className="w-16 h-8 text-sm text-center tabular-nums bg-background"
                />
                <span className="text-muted-foreground text-xs w-6">min</span>
                <span className="w-16" />
                <span className="w-4" />
                <span className="tabular-nums w-14 text-right text-muted-foreground">
                  −{lunchHoursPerDay.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
          
          {/* Net hours result */}
          <div className="pt-3 border-t border-border/50">
            <div className="grid grid-cols-[1fr,auto] items-center gap-4">
              <span className="font-semibold text-foreground">Net Available Hours</span>
              <span className="text-primary font-bold tabular-nums text-base">
                {netHoursPerDay.toFixed(1)}h<span className="text-xs font-normal text-muted-foreground">/day</span>
              </span>
            </div>

            {/* Period total */}
            {daysInPeriod > 1 && (
              <div className="grid grid-cols-[1fr,auto] items-center gap-4 mt-2">
                <span className="text-muted-foreground text-xs">Total for {daysInPeriod} days</span>
                <span className="tabular-nums font-semibold text-sm">{Math.round(totalNetHours)}h</span>
              </div>
            )}
          </div>

          {/* Padding section */}
          <div className="pt-3 border-t border-border/50 space-y-3">
            <div className="grid grid-cols-[1fr,auto] items-center gap-4">
              <span className="text-muted-foreground">Appointment Padding</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={paddingMinutes}
                  onChange={(e) => setPaddingMinutes(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                  className="w-16 h-8 text-sm text-center tabular-nums bg-background"
                />
                <span className="text-muted-foreground text-xs">min</span>
              </div>
            </div>
            {paddingMinutes > 0 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                <span>
                  Adding {paddingMinutes} min between appointments reduces effective booking capacity by ~{paddingImpact}% for 1-hour services.
                </span>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
