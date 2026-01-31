import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { PayStub } from '@/hooks/useMyPayData';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Clock, DollarSign } from 'lucide-react';

interface PayStubDetailDialogProps {
  payStub: PayStub | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function PayStubDetailDialog({ payStub, open, onOpenChange }: PayStubDetailDialogProps) {
  if (!payStub) return null;

  const totalHours = payStub.regularHours + payStub.overtimeHours;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Stub Details</DialogTitle>
          <DialogDescription>
            Pay period: {formatDate(payStub.payPeriodStart)} – {formatDate(payStub.payPeriodEnd)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Check Date */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Check Date</p>
              <p className="text-sm font-medium">{formatDate(payStub.checkDate)}</p>
            </div>
          </div>

          {/* Hours Worked */}
          {totalHours > 0 && (
            <>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hours Worked
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regular Hours</span>
                    <span>{payStub.regularHours.toFixed(1)}</span>
                  </div>
                  {payStub.overtimeHours > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overtime Hours</span>
                      <span>{payStub.overtimeHours.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Earnings */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </h4>
            <div className="space-y-2 text-sm">
              {payStub.hourlyPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Pay</span>
                  <BlurredAmount>{formatCurrency(payStub.hourlyPay)}</BlurredAmount>
                </div>
              )}
              {payStub.salaryPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary</span>
                  <BlurredAmount>{formatCurrency(payStub.salaryPay)}</BlurredAmount>
                </div>
              )}
              {payStub.commissionPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <BlurredAmount>{formatCurrency(payStub.commissionPay)}</BlurredAmount>
                </div>
              )}
              {payStub.bonusPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus</span>
                  <BlurredAmount>{formatCurrency(payStub.bonusPay)}</BlurredAmount>
                </div>
              )}
              {payStub.tips > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tips</span>
                  <BlurredAmount>{formatCurrency(payStub.tips)}</BlurredAmount>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Gross Pay */}
          <div className="flex justify-between text-sm">
            <span className="font-medium">Gross Pay</span>
            <BlurredAmount className="font-medium">
              {formatCurrency(payStub.grossPay)}
            </BlurredAmount>
          </div>

          {/* Deductions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Deductions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes (withheld)</span>
                <BlurredAmount className="text-destructive">
                  -{formatCurrency(payStub.taxes)}
                </BlurredAmount>
              </div>
              {payStub.deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Deductions</span>
                  <BlurredAmount className="text-destructive">
                    -{formatCurrency(payStub.deductions)}
                  </BlurredAmount>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Net Pay</span>
            <BlurredAmount className="text-xl font-medium text-primary">
              {formatCurrency(payStub.netPay)}
            </BlurredAmount>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
