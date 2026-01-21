import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, AlertTriangle } from 'lucide-react';

interface UsePassConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passesRemaining: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function UsePassConfirmDialog({
  open,
  onOpenChange,
  passesRemaining,
  onConfirm,
  isLoading = false,
}: UsePassConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Use a Life Happens Pass?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              This will use <strong>1 of your {passesRemaining}</strong> remaining{' '}
              {passesRemaining === 1 ? 'pass' : 'passes'}.
            </p>
            {passesRemaining === 1 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">
                  This is your <strong>last pass</strong>. Use it wisely—you won't get another one.
                </span>
              </div>
            )}
            <p className="text-sm">
              You'll continue from where you left off without restarting the program.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Using...' : 'Yes, Use Pass'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
