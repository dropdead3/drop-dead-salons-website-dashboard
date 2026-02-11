import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveCountdown } from '@/components/dashboard/LiveCountdown';
import { VisibilityGate } from '@/components/visibility';
import { usePaySchedule } from '@/hooks/usePaySchedule';
import { useHasEffectivePermission } from '@/hooks/useEffectivePermissions';
import { format } from 'date-fns';
import { AlertTriangle, ChevronRight, DollarSign, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PayrollDeadlineCard() {
  const hasPayrollPermission = useHasEffectivePermission('manage_payroll');
  const { settings, currentPeriod, isLoading } = usePaySchedule();

  // Only visible to users with manage_payroll permission
  if (!hasPayrollPermission) return null;
  if (isLoading) return null;

  // No pay schedule configured
  if (!settings) {
    return (
      <VisibilityGate
        elementKey="payroll_deadline_countdown"
        elementName="Payroll Deadline Countdown"
        elementCategory="Payroll"
      >
        <Card className="shadow-md border-border/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Settings className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Pay schedule not configured</p>
                <p className="text-xs">Set up your pay schedule to see submission deadlines.</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/admin/payroll?tab=settings">
                  Configure <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </VisibilityGate>
    );
  }

  const periodEndDate = currentPeriod.periodEnd;
  const checkDate = currentPeriod.nextPayDay;

  return (
    <VisibilityGate
      elementKey="payroll_deadline_countdown"
      elementName="Payroll Deadline Countdown"
      elementCategory="Payroll"
    >
      <Card className="shadow-md border-border/40">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-display tracking-wide">PAYROLL SUBMISSION</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(currentPeriod.periodStart, 'MMM d')} – {format(periodEndDate, 'MMM d')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 pt-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deadline</p>
              <LiveCountdown
                expiresAt={periodEndDate}
                displayMode="days"
                urgentThresholdMs={24 * 60 * 60 * 1000}
                hideIcon
                className="text-base font-medium"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Check Date</p>
              <p className="text-sm font-medium">{format(checkDate, 'MMM d')}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/dashboard/admin/payroll">
              Run Payroll <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </VisibilityGate>
  );
}
