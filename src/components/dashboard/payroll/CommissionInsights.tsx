import { Users, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTierDistribution, TierDistributionItem } from '@/hooks/useTierDistribution';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TierDistributionBar({ tier }: { tier: TierDistributionItem }) {
  const maxWidth = 100; // percent
  
  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
      <div className="w-32 shrink-0">
        <p className="font-medium text-sm">{tier.tierName}</p>
        <p className="text-xs text-muted-foreground">({(tier.tierRate * 100).toFixed(0)}%)</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Progress 
            value={(tier.stylistCount / 12) * 100} 
            className="h-3 flex-1" 
          />
          <Badge variant="secondary" className="text-xs shrink-0">
            {tier.stylistCount} {tier.stylistCount === 1 ? 'stylist' : 'stylists'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(tier.totalRevenue)} in service revenue
        </p>
      </div>
    </div>
  );
}

export function CommissionInsights() {
  const { distribution, progressionOpportunities, impactAnalysis, isLoading } = useTierDistribution();
  const { tiers, isLoading: isLoadingTiers } = useCommissionTiers();

  if (isLoading || isLoadingTiers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const serviceTiers = tiers.filter(t => t.applies_to === 'services' || t.applies_to === 'all');
  const productTiers = tiers.filter(t => t.applies_to === 'products');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Period Commissions</p>
                <p className="text-2xl font-bold">{formatCurrency(impactAnalysis.currentPeriodCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potential Additional</p>
                <p className="text-2xl font-bold text-emerald-600">
                  +{formatCurrency(impactAnalysis.potentialAdditional)}
                </p>
                <p className="text-xs text-muted-foreground">if all hit next tier</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Near Next Tier</p>
                <p className="text-2xl font-bold">{progressionOpportunities.length}</p>
                <p className="text-xs text-muted-foreground">stylists within 25%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tier Distribution
            </CardTitle>
            <CardDescription>
              How team members are distributed across commission tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distribution.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tier distribution data available</p>
                <p className="text-sm">Add employees with commission enabled to see distribution.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {distribution.map((tier) => (
                  <TierDistributionBar key={tier.tierName} tier={tier} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Tiers Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Tiers</CardTitle>
            <CardDescription>
              Current tier configuration for services and products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Service Tiers */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">Services</Badge>
                </h4>
                <div className="space-y-2">
                  {serviceTiers.map((tier) => (
                    <div 
                      key={tier.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <p className="font-medium text-sm">{tier.tier_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(tier.min_revenue)} - {tier.max_revenue ? formatCurrency(tier.max_revenue) : '∞'}
                        </p>
                      </div>
                      <Badge className="text-sm font-bold">
                        {(tier.commission_rate * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                  {serviceTiers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No service tiers configured</p>
                  )}
                </div>
              </div>

              {/* Product Tiers */}
              {productTiers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline">Products</Badge>
                  </h4>
                  <div className="space-y-2">
                    {productTiers.map((tier) => (
                      <div 
                        key={tier.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div>
                          <p className="font-medium text-sm">{tier.tier_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(tier.min_revenue)} - {tier.max_revenue ? formatCurrency(tier.max_revenue) : '∞'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-sm font-bold">
                          {(tier.commission_rate * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
