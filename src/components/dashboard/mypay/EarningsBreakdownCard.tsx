import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { EmployeeCompensation } from '@/hooks/usePayrollCalculations';
import { EmployeePayrollSettings } from '@/hooks/useEmployeePayrollSettings';
import { Progress } from '@/components/ui/progress';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { TrendingUp, Award } from 'lucide-react';

interface EarningsBreakdownCardProps {
  estimatedCompensation: EmployeeCompensation | null;
  salesData: { serviceRevenue: number; productRevenue: number };
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

export function EarningsBreakdownCard({ estimatedCompensation, salesData, settings }: EarningsBreakdownCardProps) {
  const { tiers, calculateCommission } = useCommissionTiers();
  const comp = estimatedCompensation;
  
  const totalRevenue = salesData.serviceRevenue + salesData.productRevenue;
  
  // Calculate commission to get the tier name
  const commissionResult = calculateCommission(salesData.serviceRevenue, salesData.productRevenue);
  const currentTierName = commissionResult.tierName;
  
  // Find current tier and next tier from the tiers array
  const sortedTiers = [...tiers].filter(t => t.applies_to === 'services' || t.applies_to === 'all')
    .sort((a, b) => a.min_revenue - b.min_revenue);
  
  const currentTier = sortedTiers.find(t => {
    const max = t.max_revenue ?? Infinity;
    return totalRevenue >= t.min_revenue && totalRevenue <= max;
  });
  
  const currentTierIndex = currentTier ? sortedTiers.indexOf(currentTier) : -1;
  const nextTier = currentTierIndex >= 0 && currentTierIndex < sortedTiers.length - 1 
    ? sortedTiers[currentTierIndex + 1] 
    : null;
  
  const progressToNextTier = nextTier 
    ? Math.min(100, (totalRevenue / nextTier.min_revenue) * 100)
    : 100;
  
  const amountToNextTier = nextTier 
    ? Math.max(0, nextTier.min_revenue - totalRevenue)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Earnings Breakdown</CardTitle>
        </div>
        <CardDescription>Based on your current sales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earnings Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Base Pay</p>
            <BlurredAmount className="text-sm font-medium">
              {formatCurrency((comp?.hourlyPay || 0) + (comp?.salaryPay || 0))}
            </BlurredAmount>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Commission</p>
            <BlurredAmount className="text-sm font-medium text-primary">
              {formatCurrency(comp?.commissionPay || 0)}
            </BlurredAmount>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Tips/Bonus</p>
            <BlurredAmount className="text-sm font-medium">
              {formatCurrency((comp?.tips || 0) + (comp?.bonusPay || 0))}
            </BlurredAmount>
          </div>
        </div>

        {/* Commission Tier Progress */}
        {settings.commission_enabled && currentTier && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {currentTier.tier_name} Tier
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(currentTier.commission_rate * 100)}% commission
              </span>
            </div>

            {nextTier && (
              <>
                <Progress value={progressToNextTier} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  <BlurredAmount as="span">
                    {formatCurrency(amountToNextTier)}
                  </BlurredAmount>
                  {' '}to {nextTier.tier_name} ({Math.round(nextTier.commission_rate * 100)}%)
                </p>
              </>
            )}

            {!nextTier && (
              <p className="text-xs text-muted-foreground text-center">
                You've reached the highest tier!
              </p>
            )}
          </div>
        )}

        {/* Total Revenue */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Sales This Period</span>
            <BlurredAmount className="text-sm font-medium">
              {formatCurrency(totalRevenue)}
            </BlurredAmount>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Services</span>
            <BlurredAmount className="text-xs text-muted-foreground">
              {formatCurrency(salesData.serviceRevenue)}
            </BlurredAmount>
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <span className="text-xs text-muted-foreground">Products</span>
            <BlurredAmount className="text-xs text-muted-foreground">
              {formatCurrency(salesData.productRevenue)}
            </BlurredAmount>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
