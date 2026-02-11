import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveCountdown } from '@/components/dashboard/LiveCountdown';
import { VisibilityGate } from '@/components/visibility';
import { usePaySchedule } from '@/hooks/usePaySchedule';
import { usePayrollRunForPeriod } from '@/hooks/usePayrollRunForPeriod';
import { useHasEffectivePermission } from '@/hooks/useEffectivePermissions';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { AlertTriangle, ChevronRight, DollarSign, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type UrgencyLevel = 'calm' | 'urgent' | 'critical';

function getUrgencyLevel(daysUntilDeadline: number): UrgencyLevel {
  if (daysUntilDeadline < 0) return 'critical';
  if (daysUntilDeadline <= 2) return 'urgent';
  return 'calm';
}

const urgencyStyles: Record<UrgencyLevel, { card: string; icon: string; iconBg: string }> = {
  calm: {
    card: 'border-border/40',
    icon: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  urgent: {
    card: 'border-amber-500/50',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-500/10',
  },
  critical: {
    card: 'border-destructive/50',
    icon: 'text-destructive',
    iconBg: 'bg-destructive/10',
  },
};

export function PayrollDeadlineCard() {
  const hasPayrollPermission = useHasEffectivePermission('manage_payroll');
  const { settings, currentPeriod, isLoading } = usePaySchedule();
  const { hasRun, isLoading: isCheckingRun } = usePayrollRunForPeriod(
    currentPeriod?.periodStart ?? null,
    currentPeriod?.periodEnd ?? null
  );

  // Only visible to users with manage_payroll permission
  if (!hasPayrollPermission) return null;
  if (isLoading || isCheckingRun) return null;

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

  // Payroll already submitted for this period — hide
  if (hasRun) return null;

  const periodEndDate = currentPeriod.periodEnd;
  const checkDate = currentPeriod.nextPayDay;
  const now = new Date();
  const daysUntilDeadline = differenceInDays(periodEndDate, now);

  // More than 5 days away — too early, hide
  if (daysUntilDeadline > 5) return null;

  const urgency = getUrgencyLevel(daysUntilDeadline);
  const styles = urgencyStyles[urgency];
  const isPastDeadline = daysUntilDeadline < 0;

  return (
    <VisibilityGate
      elementKey="payroll_deadline_countdown"
      elementName="Payroll Deadline Countdown"
      elementCategory="Payroll"
    >
      <Card className={cn('shadow-md', styles.card)}>
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', styles.iconBg)}>
              {isPastDeadline ? (
                <AlertTriangle className={cn('h-4 w-4', styles.icon)} />
              ) : (
                <DollarSign className={cn('h-4 w-4', styles.icon)} />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-display tracking-wide">
                {isPastDeadline ? 'PAYROLL OVERDUE' : 'PAYROLL SUBMISSION'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(currentPeriod.periodStart, 'MMM d')} – {format(periodEndDate, 'MMM d')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 pt-1 space-y-3">
          {isPastDeadline ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-destructive font-medium mb-1">Deadline Passed</p>
                <p className="text-sm font-medium text-destructive">
                  {Math.abs(daysUntilDeadline)} day{Math.abs(daysUntilDeadline) !== 1 ? 's' : ''} overdue
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Check Date</p>
                <p className="text-sm font-medium">{format(checkDate, 'MMM d')}</p>
              </div>
            </div>
          ) : (
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
          )}

          <Button
            variant={isPastDeadline ? 'destructive' : 'outline'}
            size="sm"
            className="w-full"
            asChild
          >
            <Link to="/dashboard/admin/payroll">
              {isPastDeadline ? 'Run Payroll Now' : 'Run Payroll'} <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </VisibilityGate>
  );
}
