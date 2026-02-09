import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTimeClock } from '@/hooks/useTimeClock';
import { useLocations } from '@/hooks/useLocations';
import { LocationSelect } from '@/components/ui/location-select';

const SESSION_DISMISSED_KEY = 'clock-in-prompt-dismissed';

interface ClockInPromptDialogProps {
  trigger?: boolean; // external signal to show (e.g. after unlock)
}

export function ClockInPromptDialog({ trigger }: ClockInPromptDialogProps) {
  const { isClockedIn, isLoading, clockIn, isClockingIn } = useTimeClock();
  const { data: locations = [] } = useLocations();
  const isMultiLocation = locations.length > 1;

  const [open, setOpen] = useState(false);
  const [locationId, setLocationId] = useState('');

  // Determine if we should show the prompt
  useEffect(() => {
    if (isLoading) return;
    if (isClockedIn) return;
    if (sessionStorage.getItem(SESSION_DISMISSED_KEY)) return;

    // Show on mount (login) or when trigger flips to true (unlock)
    setOpen(true);
  }, [isLoading, isClockedIn, trigger]);

  // Close when clocked in successfully
  useEffect(() => {
    if (isClockedIn && open) setOpen(false);
  }, [isClockedIn, open]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, '1');
    setOpen(false);
  };

  const handleClockIn = () => {
    clockIn({ locationId: locationId || undefined, source: 'prompt' });
  };

  if (isLoading || isClockedIn) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Start your shift?</DialogTitle>
          <DialogDescription className="text-center">
            Clock in to begin tracking your hours for today.
          </DialogDescription>
        </DialogHeader>

        {isMultiLocation && (
          <div className="py-2">
            <LocationSelect
              value={locationId}
              onValueChange={setLocationId}
              includeAll={false}
              placeholder="Select your location"
            />
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Not Now
          </Button>
          <Button onClick={handleClockIn} disabled={isClockingIn} className="flex-1 gap-2">
            <Clock className="w-4 h-4" />
            Clock In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
