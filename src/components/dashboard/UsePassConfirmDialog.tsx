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
import { Shield, AlertTriangle, Sparkles } from 'lucide-react';

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
          {/* Premium icon with gradient */}
          <div className="mx-auto mb-4 relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-oat/20 flex items-center justify-center ring-1 ring-primary/20">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-card to-oat/30 flex items-center justify-center shadow-inner">
                <Shield className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10" />
          </div>
          
          <AlertDialogTitle className="text-center text-lg">
            Use a Life Happens Pass?
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center space-y-4 pt-2">
            <p>
              This will use <strong className="text-foreground font-medium">1 of your {passesRemaining}</strong> remaining{' '}
              {passesRemaining === 1 ? 'pass' : 'passes'}.
            </p>
            
            {passesRemaining === 1 && (
              <div className="premium-alert flex items-center gap-3 p-4 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm text-left">
                  This is your <strong>last pass</strong>. Use it wisely—you won't get another one.
                </span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground/80">
              You'll continue from where you left off without restarting the program.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Elegant divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-oat/60 to-transparent" />
          <Sparkles className="h-3 w-3 text-oat-foreground/40" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-oat/60 to-transparent" />
        </div>
        
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Using...' : 'Yes, Use Pass'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
