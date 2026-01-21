import { useState } from 'react';
import { AlertCircle, Heart, Pause, RotateCcw, Clock, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MissedDayDialogProps {
  open: boolean;
  daysMissed: number;
  forgiveCreditsRemaining: number;
  hasPendingPauseRequest: boolean;
  creditExpiresAt: Date | null;
  onUseCredit: () => Promise<void>;
  onRequestPause: (reason: string) => Promise<void>;
  onRestart: () => Promise<void>;
}

export function MissedDayDialog({
  open,
  daysMissed,
  forgiveCreditsRemaining,
  hasPendingPauseRequest,
  creditExpiresAt,
  onUseCredit,
  onRequestPause,
  onRestart,
}: MissedDayDialogProps) {
  const [view, setView] = useState<'main' | 'pause'>('main');
  const [pauseReason, setPauseReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canUseCredit = forgiveCreditsRemaining > 0 && daysMissed <= 1;
  
  // Calculate time remaining for credit use (24 hours from miss)
  const getTimeRemaining = () => {
    if (!creditExpiresAt) return null;
    const now = new Date();
    const diff = creditExpiresAt.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const timeRemaining = getTimeRemaining();

  const handleUseCredit = async () => {
    setIsLoading(true);
    await onUseCredit();
    setIsLoading(false);
  };

  const handleRequestPause = async () => {
    if (!pauseReason.trim()) return;
    setIsLoading(true);
    await onRequestPause(pauseReason);
    setIsLoading(false);
    setView('main');
  };

  const handleRestart = async () => {
    setIsLoading(true);
    await onRestart();
    setIsLoading(false);
  };

  if (view === 'pause') {
    return (
      <Dialog open={open}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-primary" />
              Request Emergency Pause
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Emergency pauses are for extreme sickness or emergencies only. Leadership will review your request.
            </p>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for pause request</Label>
              <Textarea
                id="reason"
                placeholder="Please describe your emergency or situation..."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setView('main')}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleRequestPause}
                disabled={!pauseReason.trim() || isLoading}
                className="flex-1"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-2xl font-display uppercase tracking-wide">
            You Missed {daysMissed} Day{daysMissed > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            The Client Engine is a <strong className="text-foreground">75-day consecutive challenge</strong>. 
            When you miss a day, you must start over from Day 1.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium">Why the restart?</h4>
          <p className="text-sm text-muted-foreground">
            This program is designed to build <em>unbreakable habits</em>. 
            Consistency is not optional—it's the foundation of a thriving book.
          </p>
          <p className="text-sm italic text-muted-foreground">
            Things worth building are not easy.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          {/* Life Happens Pass Option */}
          {canUseCredit && (
            <div className="border rounded-lg p-4 space-y-3 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Use a Life Happens Pass</span>
                </div>
                <Badge variant="secondary">
                  {forgiveCreditsRemaining} left
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Continue from where you left off without restarting. You only have 2 passes for the entire program.
              </p>
              {timeRemaining && (
                <div className="flex items-center gap-1.5 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Expires in {timeRemaining}</span>
                </div>
              )}
              <Button 
                onClick={handleUseCredit} 
                className="w-full"
                disabled={isLoading}
              >
                <Heart className="mr-2 h-4 w-4" />
                Use Credit & Continue
              </Button>
            </div>
          )}

          {forgiveCreditsRemaining === 0 && daysMissed === 1 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <span className="text-sm">No Life Happens Passes remaining</span>
              </div>
            </div>
          )}

          {/* Request Pause Option */}
          {!hasPendingPauseRequest && (
            <Button
              variant="outline"
              onClick={() => setView('pause')}
              className="w-full"
              disabled={isLoading}
            >
              <Pause className="mr-2 h-4 w-4" />
              Request Emergency Pause
            </Button>
          )}

          {hasPendingPauseRequest && (
            <div className="border rounded-lg p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You have a pending pause request. Leadership is reviewing it.
              </p>
            </div>
          )}

          {/* Restart Option */}
          <Button
            variant="secondary"
            onClick={handleRestart}
            className="w-full"
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart from Day 1
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
