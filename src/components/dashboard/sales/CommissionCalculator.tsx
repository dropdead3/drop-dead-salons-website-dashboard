import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface CommissionCalculatorProps {
  serviceRevenue: number;
  productRevenue: number;
  stylistName?: string;
  showTierEditor?: boolean;
}

export function CommissionCalculator({ 
  serviceRevenue, 
  productRevenue, 
  stylistName,
}: CommissionCalculatorProps) {
  const { tiers, isLoading, calculateCommission } = useCommissionTiers();
  const { formatCurrencyWhole } = useFormatCurrency();

  const commission = calculateCommission(serviceRevenue, productRevenue);
  const totalRevenue = serviceRevenue + productRevenue;

  // Find next tier threshold
  const serviceTiers = tiers.filter(t => t.applies_to === 'services' || t.applies_to === 'all');
  const currentTierIdx = serviceTiers.findIndex(t => 
    serviceRevenue >= t.min_revenue && (t.max_revenue === null || serviceRevenue <= t.max_revenue)
  );
  const nextTier = currentTierIdx >= 0 && currentTierIdx < serviceTiers.length - 1 
    ? serviceTiers[currentTierIdx + 1] 
    : null;
  
  const progressToNextTier = nextTier 
    ? ((serviceRevenue - serviceTiers[currentTierIdx].min_revenue) / 
       (nextTier.min_revenue - serviceTiers[currentTierIdx].min_revenue)) * 100
    : 100;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-base tracking-wide">COMMISSION CALCULATOR</CardTitle>
            <CardDescription className="text-xs">
              {stylistName ? `Estimated earnings for ${stylistName}` : 'Estimated earnings based on current tiers and date range'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Main commission display */}
        <div className="text-center p-5 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Estimated Commission</p>
          <BlurredAmount className="text-3xl font-display">
            {formatCurrencyWhole(Math.round(commission.totalCommission))}
          </BlurredAmount>
          <Badge variant="outline" className="mt-2">{commission.tierName}</Badge>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-[11px] text-muted-foreground">Service Commission</p>
            <BlurredAmount className="text-lg font-display">
              {formatCurrencyWhole(Math.round(commission.serviceCommission))}
            </BlurredAmount>
            <BlurredAmount className="text-[11px] text-muted-foreground">
              from {formatCurrencyWhole(serviceRevenue)} in services
            </BlurredAmount>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-[11px] text-muted-foreground">Product Commission</p>
            <BlurredAmount className="text-lg font-display">
              {formatCurrencyWhole(Math.round(commission.productCommission))}
            </BlurredAmount>
            <BlurredAmount className="text-[11px] text-muted-foreground">
              from {formatCurrencyWhole(productRevenue)} in products
            </BlurredAmount>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextTier.tier_name}</span>
              <BlurredAmount className="font-medium">
                {formatCurrencyWhole(nextTier.min_revenue - serviceRevenue)} to go
              </BlurredAmount>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
            <BlurredAmount className="text-[11px] text-muted-foreground">
              Reach {formatCurrencyWhole(nextTier.min_revenue)} in services to unlock {(nextTier.commission_rate * 100).toFixed(0)}% rate
            </BlurredAmount>
          </div>
        )}

        {!nextTier && currentTierIdx >= 0 && (
          <div className="p-3 bg-chart-2/5 border border-chart-2/20 rounded-lg text-center">
            <p className="text-sm text-chart-2 font-medium">
              Highest commission tier reached
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
