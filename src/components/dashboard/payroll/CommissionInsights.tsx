import { Users, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTierDistribution, TierDistributionItem } from '@/hooks/useTierDistribution';

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

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
                <p className="text-2xl font-medium">{formatCurrency(impactAnalysis.currentPeriodCommissions)}</p>
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
                <p className="text-2xl font-medium text-emerald-600">
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
                <p className="text-2xl font-medium">{progressionOpportunities.length}</p>
                <p className="text-xs text-muted-foreground">stylists within 25%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
