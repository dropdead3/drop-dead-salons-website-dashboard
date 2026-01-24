import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Settings, Target, MapPin, Loader2 } from 'lucide-react';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useLocations } from '@/hooks/useLocations';
import { useSalesByLocation } from '@/hooks/useSalesData';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const WEEKS_PER_MONTH = 4.333;
const MONTHS_PER_YEAR = 12;

interface SalesGoalsDialogProps {
  trigger?: React.ReactNode;
}

export function SalesGoalsDialog({ trigger }: SalesGoalsDialogProps) {
  const [open, setOpen] = useState(false);
  const { goals, updateGoals, isUpdating } = useSalesGoals();
  const { data: locations } = useLocations();

  // Get current month's revenue by location
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const { data: locationRevenue } = useSalesByLocation(monthStart, monthEnd);

  // Map location revenue for easy lookup
  const revenueByLocationId = useMemo(() => {
    const map: Record<string, number> = {};
    locationRevenue?.forEach(loc => {
      if (loc.location_id) {
        map[loc.location_id] = loc.totalRevenue || 0;
      }
    });
    return map;
  }, [locationRevenue]);

  const [locationTargets, setLocationTargets] = useState<Record<string, { monthly: number; weekly: number }>>(
    goals?.locationTargets || {}
  );

  // Update local state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && goals) {
      setLocationTargets(goals.locationTargets || {});
    }
    setOpen(isOpen);
  };

  // Update location monthly and auto-calculate weekly
  const updateLocationTarget = (locationId: string, value: number) => {
    setLocationTargets(prev => ({
      ...prev,
      [locationId]: {
        monthly: value,
        weekly: Math.round(value / WEEKS_PER_MONTH),
      },
    }));
  };

  // Calculate overall targets from location goals
  const calculatedMonthly = locations?.reduce((sum, loc) => {
    return sum + (locationTargets[loc.id]?.monthly || 0);
  }, 0) || 0;

  const calculatedWeekly = Math.round(calculatedMonthly / WEEKS_PER_MONTH);
  const calculatedYearly = calculatedMonthly * MONTHS_PER_YEAR;

  // Calculate overall current revenue
  const totalCurrentRevenue = locations?.reduce((sum, loc) => {
    return sum + (revenueByLocationId[loc.id] || 0);
  }, 0) || 0;

  const overallProgress = calculatedMonthly > 0 
    ? Math.min(100, Math.round((totalCurrentRevenue / calculatedMonthly) * 100))
    : 0;

  const handleSave = () => {
    updateGoals({
      monthlyTarget: calculatedMonthly,
      weeklyTarget: calculatedWeekly,
      locationTargets,
    });
    setOpen(false);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'text-green-600';
    if (percent >= 75) return 'text-primary';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Goals
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sales Goals
          </DialogTitle>
          <DialogDescription>
            Set monthly revenue targets for each location. Weekly goals and overall totals are calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Location-Specific Goals (Primary) */}
          {locations && locations.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location Goals
              </h3>
              <div className="space-y-3">
                {locations.map((location) => {
                  const currentRevenue = revenueByLocationId[location.id] || 0;
                  const monthlyGoal = locationTargets[location.id]?.monthly || 0;
                  const progressPercent = monthlyGoal > 0 
                    ? Math.min(100, Math.round((currentRevenue / monthlyGoal) * 100))
                    : 0;

                  return (
                    <div key={location.id} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{location.name}</p>
                        {monthlyGoal > 0 && (
                          <span className={`text-xs font-medium ${getProgressColor(progressPercent)}`}>
                            {progressPercent}%
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      {monthlyGoal > 0 && (
                        <div className="space-y-1">
                          <Progress value={progressPercent} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            ${currentRevenue.toLocaleString()} of ${monthlyGoal.toLocaleString()} this month
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        {/* Monthly - Editable */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Monthly</Label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <Input
                              type="number"
                              value={locationTargets[location.id]?.monthly || ''}
                              onChange={(e) => updateLocationTarget(location.id, Number(e.target.value))}
                              placeholder="0"
                              className="pl-5 h-8 text-sm"
                            />
                          </div>
                        </div>
                        {/* Weekly - Read-Only */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Weekly</Label>
                          <p className="h-8 flex items-center text-sm text-muted-foreground">
                            ${Math.round((locationTargets[location.id]?.monthly || 0) / WEEKS_PER_MONTH).toLocaleString()}
                          </p>
                        </div>
                        {/* Yearly - Read-Only */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Yearly</Label>
                          <p className="h-8 flex items-center text-sm text-muted-foreground">
                            ${((locationTargets[location.id]?.monthly || 0) * MONTHS_PER_YEAR).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No locations found. Add locations to set specific goals.
            </p>
          )}

          {/* Overall Targets - Calculated (Read-Only) */}
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Overall Targets
                <span className="text-xs text-muted-foreground font-normal">(calculated)</span>
              </h3>
              {calculatedMonthly > 0 && (
                <span className={`text-xs font-medium ${getProgressColor(overallProgress)}`}>
                  {overallProgress}%
                </span>
              )}
            </div>
            
            {calculatedMonthly > 0 && (
              <div className="space-y-1">
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  ${totalCurrentRevenue.toLocaleString()} of ${calculatedMonthly.toLocaleString()} this month
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Monthly Goal</Label>
                <p className="text-xl font-semibold">
                  ${calculatedMonthly.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Weekly Goal</Label>
                <p className="text-xl font-semibold">
                  ${calculatedWeekly.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Yearly Goal</Label>
                <p className="text-xl font-semibold">
                  ${calculatedYearly.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Goals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
