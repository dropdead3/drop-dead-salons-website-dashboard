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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Settings, Target, MapPin, Loader2 } from 'lucide-react';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { useLocations } from '@/hooks/useLocations';

interface SalesGoalsDialogProps {
  trigger?: React.ReactNode;
}

export function SalesGoalsDialog({ trigger }: SalesGoalsDialogProps) {
  const [open, setOpen] = useState(false);
  const { goals, updateGoals, isUpdating } = useSalesGoals();
  const { data: locations } = useLocations();

  const [monthlyTarget, setMonthlyTarget] = useState(goals?.monthlyTarget || 50000);
  const [weeklyTarget, setWeeklyTarget] = useState(goals?.weeklyTarget || 12500);
  const [locationTargets, setLocationTargets] = useState<Record<string, { monthly: number; weekly: number }>>(
    goals?.locationTargets || {}
  );

  // Update local state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && goals) {
      setMonthlyTarget(goals.monthlyTarget);
      setWeeklyTarget(goals.weeklyTarget);
      setLocationTargets(goals.locationTargets || {});
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    updateGoals({
      monthlyTarget,
      weeklyTarget,
      locationTargets,
    });
    setOpen(false);
  };

  const updateLocationTarget = (locationId: string, field: 'monthly' | 'weekly', value: number) => {
    setLocationTargets(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        [field]: value,
      },
    }));
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
            Set revenue targets for your team. These goals are used to track progress on the dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Targets */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Overall Targets
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly">Monthly Goal</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly">Weekly Goal</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="weekly"
                    type="number"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location-Specific Targets */}
          {locations && locations.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="locations" className="border-none">
                <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location-Specific Goals
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {locations.map((location) => (
                      <div key={location.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium">{location.name}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Monthly</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                              <Input
                                type="number"
                                value={locationTargets[location.id]?.monthly || ''}
                                onChange={(e) => updateLocationTarget(location.id, 'monthly', Number(e.target.value))}
                                placeholder={String(monthlyTarget / (locations?.length || 1))}
                                className="pl-5 h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Weekly</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                              <Input
                                type="number"
                                value={locationTargets[location.id]?.weekly || ''}
                                onChange={(e) => updateLocationTarget(location.id, 'weekly', Number(e.target.value))}
                                placeholder={String(weeklyTarget / (locations?.length || 1))}
                                className="pl-5 h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use a proportional share of the overall goal.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
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
