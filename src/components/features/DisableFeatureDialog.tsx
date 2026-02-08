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
import { ShieldCheck, Database, RotateCcw } from 'lucide-react';

interface DisableFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  onConfirm: () => void;
}

export function DisableFeatureDialog({
  open,
  onOpenChange,
  featureName,
  onConfirm,
}: DisableFeatureDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable {featureName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This feature will be hidden from your team, but all data will be preserved.
              </p>
              
              <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Data Preserved</p>
                    <p className="text-sm text-muted-foreground">
                      All existing data, settings, and history will be safely stored.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Hidden from Navigation</p>
                    <p className="text-sm text-muted-foreground">
                      The feature will no longer appear in menus or dashboards.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <RotateCcw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Instant Restore</p>
                    <p className="text-sm text-muted-foreground">
                      Re-enable anytime to restore full access with all data intact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Disable Feature
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
