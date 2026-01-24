import { format, differenceInMinutes, parseISO } from 'date-fns';
import { Copy, CreditCard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import type { PhorestAppointment } from '@/hooks/usePhorestCalendar';

interface CheckoutSummarySheetProps {
  appointment: PhorestAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isUpdating?: boolean;
}

const TAX_RATE = 0.08; // 8% tax rate - can be made configurable later

export function CheckoutSummarySheet({
  appointment,
  open,
  onOpenChange,
  onConfirm,
  isUpdating = false,
}: CheckoutSummarySheetProps) {
  if (!appointment) return null;

  const subtotal = appointment.total_price || 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Calculate duration
  const getDuration = () => {
    try {
      const start = parseISO(`${appointment.appointment_date}T${appointment.start_time}`);
      const end = parseISO(`${appointment.appointment_date}T${appointment.end_time}`);
      const mins = differenceInMinutes(end, start);
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (hours > 0 && remainingMins > 0) {
        return `${hours}h ${remainingMins}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      }
      return `${mins} min`;
    } catch {
      return '';
    }
  };

  const copyPhone = () => {
    if (appointment.client_phone) {
      navigator.clipboard.writeText(appointment.client_phone);
      toast.success('Phone copied');
    }
  };

  const formatDate = () => {
    try {
      return format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy');
    } catch {
      return appointment.appointment_date;
    }
  };

  const formatTime = () => {
    try {
      const start = parseISO(`${appointment.appointment_date}T${appointment.start_time}`);
      return format(start, 'h:mm a');
    } catch {
      return appointment.start_time;
    }
  };

  const stylistName = appointment.stylist_profile?.display_name || 
                      appointment.stylist_profile?.full_name || 
                      'Staff';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout Summary
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-lg">
                {appointment.client_name || 'Walk-in'}
              </p>
              {appointment.client_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {appointment.client_phone}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyPhone}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Service Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Service Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-right max-w-[60%]">
                  {appointment.service_name || 'Service'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stylist</span>
                <span className="font-medium">{stylistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{formatTime()}</span>
              </div>
              {getDuration() && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{getDuration()}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg border">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Process payment on PhorestPay terminal, then confirm below.
            </p>
          </div>

          {/* Confirm Button */}
          <Button
            className="w-full gap-2"
            variant="default"
            size="lg"
            onClick={onConfirm}
            disabled={isUpdating}
          >
            <CreditCard className="h-4 w-4" />
            {isUpdating ? 'Processing...' : 'Mark as Paid'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
