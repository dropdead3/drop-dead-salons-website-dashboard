import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Gift, Users, Coins, Trophy, Target } from 'lucide-react';
import { useRewardsCatalog, usePendingRedemptions } from '@/hooks/usePoints';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = 'primary' 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="font-display text-2xl mt-1">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </div>
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `hsl(var(--${color}) / 0.1)` }}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RewardsAnalyticsTab() {
  const { data: rewards = [], isLoading: rewardsLoading } = useRewardsCatalog(false);
  const { data: pendingRedemptions = [] } = usePendingRedemptions();

  // Fetch total redemptions
  const { data: redemptionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['redemption-stats'],
    queryFn: async () => {
      const { data: redemptions, error } = await supabase
        .from('reward_redemptions')
        .select('id, points_spent, status, created_at, reward_id');

      if (error) throw error;

      const totalRedemptions = redemptions.length;
      const totalPointsSpent = redemptions.reduce((sum, r) => sum + (r.points_spent || 0), 0);
      const fulfilledCount = redemptions.filter(r => r.status === 'fulfilled').length;
      const deniedCount = redemptions.filter(r => r.status === 'denied').length;

      // Top redeemed rewards
      const rewardCounts = redemptions.reduce((acc, r) => {
        acc[r.reward_id] = (acc[r.reward_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topRewardIds = Object.entries(rewardCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      return {
        totalRedemptions,
        totalPointsSpent,
        fulfilledCount,
        deniedCount,
        topRewardIds,
        rewardCounts,
      };
    },
  });

  // Fetch total points in circulation
  const { data: pointsStats } = useQuery({
    queryKey: ['points-circulation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points');

      if (error) throw error;

      const totalEarned = data.filter(p => p.points > 0).reduce((sum, p) => sum + p.points, 0);
      const totalSpent = Math.abs(data.filter(p => p.points < 0).reduce((sum, p) => sum + p.points, 0));
      const inCirculation = totalEarned - totalSpent;

      return { totalEarned, totalSpent, inCirculation };
    },
  });

  const isLoading = rewardsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeRewards = rewards.filter(r => r.is_active).length;
  const topRewards = redemptionStats?.topRewardIds
    .map(id => rewards.find(r => r.id === id))
    .filter(Boolean) || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Gift}
          label="Active Rewards"
          value={activeRewards}
          subtext={`${rewards.length} total in catalog`}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Redemptions"
          value={redemptionStats?.totalRedemptions || 0}
          subtext={`${redemptionStats?.fulfilledCount || 0} fulfilled`}
        />
        <StatCard
          icon={Coins}
          label="Points in Circulation"
          value={(pointsStats?.inCirculation || 0).toLocaleString()}
          subtext={`${(pointsStats?.totalEarned || 0).toLocaleString()} earned total`}
        />
        <StatCard
          icon={Users}
          label="Pending Approvals"
          value={pendingRedemptions.length}
          subtext="Awaiting review"
        />
      </div>

      {/* Top Rewards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">TOP REDEEMED REWARDS</CardTitle>
          </div>
          <CardDescription>
            Most popular rewards based on redemption count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topRewards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No redemptions yet. Data will appear once team members start redeeming rewards.
            </p>
          ) : (
            <div className="space-y-3">
              {topRewards.map((reward, index) => (
                <div 
                  key={reward!.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{reward!.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reward!.points_cost} points
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {redemptionStats?.rewardCounts[reward!.id] || 0} redeemed
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Economy Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">ECONOMY HEALTH</CardTitle>
          </div>
          <CardDescription>
            Monitor the balance of your points economy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground uppercase">Total Earned</p>
              <p className="font-display text-xl text-green-600 dark:text-green-400">
                +{(pointsStats?.totalEarned || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-muted-foreground uppercase">Total Spent</p>
              <p className="font-display text-xl text-red-600 dark:text-red-400">
                -{(pointsStats?.totalSpent || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase">Net Circulation</p>
              <p className="font-display text-xl">
                {(pointsStats?.inCirculation || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm font-medium mb-2">💡 Tips for a Healthy Economy</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Keep points in circulation under 3x monthly earning capacity</li>
              <li>• Introduce new rewards periodically to drive redemptions</li>
              <li>• Monitor denial rate - high denials may frustrate team members</li>
              <li>• Consider limited-time rewards for excess point balances</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
