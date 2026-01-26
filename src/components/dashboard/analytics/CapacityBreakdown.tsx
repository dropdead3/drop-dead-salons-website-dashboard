import { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  grossHoursPerStylist,
  breakMinutes,
  lunchMinutes,
  paddingMinutes,
  stylistCount,
  daysInPeriod,
  className,
}: CapacityBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const breakHoursPerDay = (breakMinutes / 60) * stylistCount;
  const lunchHoursPerDay = (lunchMinutes / 60) * stylistCount;
  const grossHoursPerDay = grossHoursPerStylist * stylistCount;
  const netHoursPerDay = grossHoursPerDay - breakHoursPerDay - lunchHoursPerDay;
  
  const totalGrossHours = grossHoursPerDay * daysInPeriod;
  const totalBreakDeduction = breakHoursPerDay * daysInPeriod;
  const totalLunchDeduction = lunchHoursPerDay * daysInPeriod;
  const totalNetHours = netHoursPerDay * daysInPeriod;

  // Calculate padding impact (as percentage of booking time)
  const avgAppointmentMinutes = 60; // Assume 1-hour average
  const paddingImpact = paddingMinutes > 0 
    ? Math.round((paddingMinutes / (avgAppointmentMinutes + paddingMinutes)) * 100)
    : 0;

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
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
          <div className="font-medium text-foreground mb-2">Daily Capacity Breakdown</div>
          
          {/* Gross hours */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Operating Hours × Stylists</span>
            <span className="font-medium tabular-nums">
              {grossHoursPerStylist}h × {stylistCount} = {grossHoursPerDay}h
            </span>
          </div>
          
          {/* Break deduction */}
          {breakMinutes > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Less Breaks ({breakMinutes} min/stylist)</span>
              <span className="tabular-nums">−{breakHoursPerDay.toFixed(1)}h</span>
            </div>
          )}
          
          {/* Lunch deduction */}
          {lunchMinutes > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Less Lunch ({lunchMinutes} min/stylist)</span>
              <span className="tabular-nums">−{lunchHoursPerDay.toFixed(1)}h</span>
            </div>
          )}
          
          {/* Divider */}
          <div className="border-t border-border/50 my-1" />
          
          {/* Net hours */}
          <div className="flex items-center justify-between font-medium">
            <span className="text-foreground">Net Available Hours</span>
            <span className="text-primary tabular-nums">{netHoursPerDay.toFixed(1)}h/day</span>
          </div>

          {/* Period total */}
          {daysInPeriod > 1 && (
            <div className="flex items-center justify-between text-muted-foreground pt-1">
              <span>Total for {daysInPeriod} days</span>
              <span className="tabular-nums">{Math.round(totalNetHours)}h</span>
            </div>
          )}

          {/* Padding note */}
          {paddingMinutes > 0 && (
            <div className="flex items-start gap-1.5 pt-2 text-muted-foreground border-t border-border/50 mt-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Appointment padding ({paddingMinutes} min between appts) reduces 
                effective booking time by ~{paddingImpact}% for 1-hour appointments.
              </span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
