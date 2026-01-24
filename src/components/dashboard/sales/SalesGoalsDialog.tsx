import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const WEEKS_PER_MONTH = 4.333;

interface SalesGoalsDialogProps {
  trigger?: React.ReactNode;
}

export function SalesGoalsDialog({ trigger }: SalesGoalsDialogProps) {
  const [open, setOpen] = useState(false);
  const { goals, updateGoals, isUpdating } = useSalesGoals();
  const { data: locations } = useLocations();

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

  const handleSave = () => {
    updateGoals({
      monthlyTarget: calculatedMonthly,
      weeklyTarget: calculatedWeekly,
      locationTargets,
    });
    setOpen(false);
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
      <DialogContent className="max-w-md">
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
                {locations.map((location) => (
                  <div key={location.id} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                    <p className="text-sm font-medium">{location.name}</p>
                    <div className="grid grid-cols-2 gap-3">
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
                      {/* Weekly - Read-Only (Auto-Calculated) */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Weekly</Label>
                        <p className="h-8 flex items-center text-sm text-muted-foreground">
                          ${Math.round((locationTargets[location.id]?.monthly || 0) / WEEKS_PER_MONTH).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No locations found. Add locations to set specific goals.
            </p>
          )}

          {/* Overall Targets - Calculated (Read-Only) */}
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Overall Targets
              <span className="text-xs text-muted-foreground font-normal">(calculated)</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
