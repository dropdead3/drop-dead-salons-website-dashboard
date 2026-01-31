import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { EmployeeCompensation } from '@/hooks/usePayrollCalculations';
import { EmployeePayrollSettings } from '@/hooks/useEmployeePayrollSettings';
import { CurrentPeriod } from '@/hooks/useMyPayData';
import { format, parseISO } from 'date-fns';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CurrentPeriodCardProps {
  currentPeriod: CurrentPeriod;
  estimatedCompensation: EmployeeCompensation | null;
  settings: EmployeePayrollSettings;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export function CurrentPeriodCard({ currentPeriod, estimatedCompensation, settings }: CurrentPeriodCardProps) {
  const comp = estimatedCompensation;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Current Period</CardTitle>
        </div>
        <CardDescription>
          {formatDate(currentPeriod.startDate)} – {formatDate(currentPeriod.endDate)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {comp ? (
          <>
            {/* Base Pay Section */}
            {(comp.hourlyPay > 0 || comp.salaryPay > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {comp.salaryPay > 0 ? 'Salary' : 'Hourly Pay'}
                </span>
                <BlurredAmount className="text-sm">
                  {formatCurrency(comp.salaryPay > 0 ? comp.salaryPay : comp.hourlyPay)}
                </BlurredAmount>
              </div>
            )}

            {/* Commission */}
            {settings.commission_enabled && comp.commissionPay > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Commission*</span>
                <BlurredAmount className="text-sm text-primary">
                  {formatCurrency(comp.commissionPay)}
                </BlurredAmount>
              </div>
            )}

            <Separator />

            {/* Gross */}
            <div className="flex justify-between items-center">
              <span className="text-sm">Est. Gross</span>
              <BlurredAmount className="text-sm font-medium">
                {formatCurrency(comp.grossPay)}
              </BlurredAmount>
            </div>

            {/* Taxes */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Est. Taxes</span>
              <BlurredAmount className="text-sm text-muted-foreground">
                ~{formatCurrency(comp.estimatedTaxes)}
              </BlurredAmount>
            </div>

            <Separator />

            {/* Net */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Est. Net</span>
              <BlurredAmount className="text-lg font-medium text-primary">
                ~{formatCurrency(comp.netPay)}
              </BlurredAmount>
            </div>

            {settings.commission_enabled && (
              <p className="text-xs text-muted-foreground mt-4">
                *Commission is estimated based on current sales data and may change.
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Unable to calculate estimates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
