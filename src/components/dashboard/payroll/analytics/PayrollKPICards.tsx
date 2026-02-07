import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Percent,
  Clock,
  Building2,
  Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PayrollKPIs } from '@/hooks/usePayrollAnalytics';

interface PayrollKPICardsProps {
  kpis: PayrollKPIs;
  isLoading: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  iconClassName?: string;
  isLoading?: boolean;
}

function KPICard({ title, value, subtitle, trend, icon: Icon, iconClassName, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-1',
                trend >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercent(trend)}</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn(
            'p-2 rounded-lg bg-primary/10',
            iconClassName
          )}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PayrollKPICards({ kpis, isLoading }: PayrollKPICardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Next Payroll Forecast"
        value={formatCurrency(kpis.nextPayrollForecast)}
        trend={kpis.forecastChange}
        icon={DollarSign}
        isLoading={isLoading}
      />
      <KPICard
        title="YTD Payroll Total"
        value={formatCurrency(kpis.ytdPayrollTotal)}
        subtitle="total gross pay"
        icon={Wallet}
        isLoading={isLoading}
      />
      <KPICard
        title="Labor Cost"
        value={`${kpis.laborCostRatio.toFixed(1)}%`}
        subtitle="of revenue"
        icon={Percent}
        isLoading={isLoading}
      />
      <KPICard
        title="Commission Ratio"
        value={`${kpis.commissionRatio.toFixed(1)}%`}
        subtitle="of gross pay"
        icon={TrendingUp}
        isLoading={isLoading}
      />
      <KPICard
        title="Employer Tax Burden"
        value={formatCurrency(kpis.employerTaxBurden)}
        subtitle="estimated taxes"
        icon={Building2}
        isLoading={isLoading}
      />
      <KPICard
        title="Active Employees"
        value={kpis.activeEmployeeCount.toString()}
        subtitle="on payroll"
        icon={Users}
        isLoading={isLoading}
      />
      <KPICard
        title="Overtime Hours"
        value={`${kpis.overtimeHours} hrs`}
        subtitle="this period"
        icon={Clock}
        isLoading={isLoading}
      />
      <KPICard
        title="Tips Collected"
        value={formatCurrency(kpis.tipsCollected)}
        subtitle="this period"
        icon={DollarSign}
        iconClassName="bg-emerald-500/10"
        isLoading={isLoading}
      />
    </div>
  );
}
