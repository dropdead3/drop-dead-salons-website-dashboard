import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  showTierEditor = false 
}: CommissionCalculatorProps) {
  const { tiers, isLoading, calculateCommission } = useCommissionTiers();
  const [showDetails, setShowDetails] = useState(false);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-chart-5" />
            <CardTitle className="font-display text-lg">Commission Calculator</CardTitle>
          </div>
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Commission Tiers</DialogTitle>
                <DialogDescription>
                  Current commission structure for service and product sales
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Service Tiers</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Revenue Range</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceTiers.map(tier => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">{tier.tier_name}</TableCell>
                        <TableCell>
                          <BlurredAmount>
                            ${tier.min_revenue.toLocaleString()} - 
                            {tier.max_revenue ? `$${tier.max_revenue.toLocaleString()}` : '∞'}
                          </BlurredAmount>
                        </TableCell>
                        <TableCell className="text-right">
                          {(tier.commission_rate * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <h4 className="text-sm font-medium mt-4 mb-2">Product Commission</h4>
                {tiers.filter(t => t.applies_to === 'products').map(tier => (
                  <p key={tier.id} className="text-sm text-muted-foreground">
                    {(tier.commission_rate * 100).toFixed(0)}% on all product sales
                  </p>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          {stylistName ? `Estimated earnings for ${stylistName}` : 'Based on current commission tiers'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main commission display */}
        <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Estimated Commission</p>
          <BlurredAmount className="text-3xl font-display">
            ${commission.totalCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </BlurredAmount>
          <Badge variant="outline" className="mt-2">{commission.tierName}</Badge>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Service Commission</p>
            <BlurredAmount className="text-lg font-medium">
              ${commission.serviceCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </BlurredAmount>
            <BlurredAmount className="text-xs text-muted-foreground">
              from ${serviceRevenue.toLocaleString()} in services
            </BlurredAmount>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Product Commission</p>
            <BlurredAmount className="text-lg font-medium">
              ${commission.productCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </BlurredAmount>
            <BlurredAmount className="text-xs text-muted-foreground">
              from ${productRevenue.toLocaleString()} in products
            </BlurredAmount>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextTier.tier_name}</span>
              <BlurredAmount className="font-medium">
                ${(nextTier.min_revenue - serviceRevenue).toLocaleString()} to go
              </BlurredAmount>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
            <BlurredAmount className="text-xs text-muted-foreground">
              Reach ${nextTier.min_revenue.toLocaleString()} in services to unlock {(nextTier.commission_rate * 100).toFixed(0)}% rate
            </BlurredAmount>
          </div>
        )}

        {!nextTier && currentTierIdx >= 0 && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              🎉 You're at the highest commission tier!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
