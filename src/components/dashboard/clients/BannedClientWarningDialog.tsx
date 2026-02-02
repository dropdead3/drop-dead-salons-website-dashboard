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
import { Ban } from 'lucide-react';

interface BannedClientWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  banReason?: string | null;
  onProceed: () => void;
  onCancel: () => void;
}

export function BannedClientWarningDialog({
  open,
  onOpenChange,
  clientName,
  banReason,
  onProceed,
  onCancel,
}: BannedClientWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl">Client is Blacklisted</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              <span className="font-semibold text-foreground">{clientName}</span> has been banned and should not be scheduled for appointments.
            </p>
            {banReason && (
              <p className="p-3 rounded-lg bg-muted text-sm">
                <span className="font-medium">Reason:</span> {banReason}
              </p>
            )}
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              Are you sure you want to proceed with this booking?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Proceed Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
