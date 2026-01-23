import { 
  Check, 
  CreditCard, 
  Trash2, 
  StickyNote, 
  CheckCircle,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';

interface ScheduleActionBarProps {
  selectedAppointment: PhorestAppointment | null;
  onCheckIn?: () => void;
  onPay?: () => void;
  onRemove?: () => void;
  onNotes?: () => void;
  onConfirm?: () => void;
  onUndo?: () => void;
  isUpdating?: boolean;
}

export function ScheduleActionBar({
  selectedAppointment,
  onCheckIn,
  onPay,
  onRemove,
  onNotes,
  onConfirm,
  onUndo,
  isUpdating = false,
}: ScheduleActionBarProps) {
  const hasSelection = !!selectedAppointment;
  const status = selectedAppointment?.status;

  // Determine which actions are available based on current status
  const canCheckIn = hasSelection && status === 'confirmed';
  const canConfirm = hasSelection && status === 'booked';
  const canPay = hasSelection && status === 'checked_in';
  const canRemove = hasSelection && !['completed', 'cancelled'].includes(status || '');

  return (
    <div className="bg-card border-t border-border px-4 py-2.5 flex items-center justify-between">
      {/* Left: Undo */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={isUpdating}
          className="gap-1.5"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCheckIn}
          disabled={!canCheckIn || isUpdating}
          className={cn(
            'gap-1.5',
            canCheckIn && 'border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
          )}
        >
          <Check className="h-4 w-4" />
          Check In
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPay}
          disabled={!canPay || isUpdating}
          className={cn(
            'gap-1.5',
            canPay && 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950'
          )}
        >
          <CreditCard className="h-4 w-4" />
          Pay
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove || isUpdating}
          className="gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Cancel
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNotes}
          disabled={!hasSelection || isUpdating}
          className="gap-1.5"
        >
          <StickyNote className="h-4 w-4" />
          Notes
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onConfirm}
          disabled={!canConfirm || isUpdating}
          className={cn(
            'gap-1.5',
            canConfirm && 'border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950'
          )}
        >
          <CheckCircle className="h-4 w-4" />
          Confirm
        </Button>
      </div>
    </div>
  );
}
