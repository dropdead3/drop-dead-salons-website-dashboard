import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface LoyaltyAnalyticsDaily {
  id: string;
  organization_id: string;
  analytics_date: string;
  points_earned: number;
  points_redeemed: number;
  points_expired: number;
  active_members: number;
  new_enrollments: number;
  tier_upgrades: number;
  loyalty_attributed_revenue: number;
  redemption_value: number;
}

export interface LoyaltyAnalyticsSummary {
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  netPointsBalance: number;
  activeMembersCount: number;
  newEnrollments: number;
  tierUpgrades: number;
  loyaltyRevenue: number;
  redemptionValue: number;
  pointsLiability: number; // Unredeemed points value
  dailyTrend: LoyaltyAnalyticsDaily[];
}

export interface TierDistribution {
  tier: string;
  count: number;
  percentage: number;
}

export function useLoyaltyAnalytics(organizationId?: string, days: number = 30) {
  return useQuery({
    queryKey: ['loyalty-analytics', organizationId, days],
    queryFn: async (): Promise<LoyaltyAnalyticsSummary> => {
      if (!organizationId) {
        return {
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          totalPointsExpired: 0,
          netPointsBalance: 0,
          activeMembersCount: 0,
          newEnrollments: 0,
          tierUpgrades: 0,
          loyaltyRevenue: 0,
          redemptionValue: 0,
          pointsLiability: 0,
          dailyTrend: [],
        };
      }

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('loyalty_analytics_daily' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .gte('analytics_date', startDate)
        .order('analytics_date', { ascending: true });

      if (error) throw error;
      
      const dailyData = (data || []) as unknown as LoyaltyAnalyticsDaily[];
      
      // Aggregate totals
      const totals = dailyData.reduce(
        (acc, day) => ({
          totalPointsEarned: acc.totalPointsEarned + (day.points_earned || 0),
          totalPointsRedeemed: acc.totalPointsRedeemed + (day.points_redeemed || 0),
          totalPointsExpired: acc.totalPointsExpired + (day.points_expired || 0),
          newEnrollments: acc.newEnrollments + (day.new_enrollments || 0),
          tierUpgrades: acc.tierUpgrades + (day.tier_upgrades || 0),
          loyaltyRevenue: acc.loyaltyRevenue + Number(day.loyalty_attributed_revenue || 0),
          redemptionValue: acc.redemptionValue + Number(day.redemption_value || 0),
        }),
        {
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          totalPointsExpired: 0,
          newEnrollments: 0,
          tierUpgrades: 0,
          loyaltyRevenue: 0,
          redemptionValue: 0,
        }
      );

      // Get the most recent active members count
      const activeMembersCount = dailyData.length > 0 
        ? dailyData[dailyData.length - 1].active_members 
        : 0;

      const netPointsBalance = totals.totalPointsEarned - totals.totalPointsRedeemed - totals.totalPointsExpired;
      
      // Calculate points liability (assuming 100 points = $1 redemption value)
      // This should come from loyalty settings in a real implementation
      const pointsLiability = netPointsBalance * 0.01;

      return {
        ...totals,
        netPointsBalance,
        activeMembersCount,
        pointsLiability,
        dailyTrend: dailyData,
      };
    },
    enabled: !!organizationId,
  });
}

export function useTierDistribution(organizationId?: string) {
  return useQuery({
    queryKey: ['loyalty-tier-distribution', organizationId],
    queryFn: async (): Promise<TierDistribution[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('client_loyalty_points' as any)
        .select('tier')
        .eq('organization_id', organizationId);

      if (error) throw error;
      
      const tierCounts = (data || []).reduce((acc: Record<string, number>, item: any) => {
        const tier = item.tier || 'Bronze';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

      const total = Object.values(tierCounts).reduce((sum, count) => sum + count, 0);
      
      return Object.entries(tierCounts).map(([tier, count]) => ({
        tier,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    },
    enabled: !!organizationId,
  });
}

export function usePromotionRedemptions(organizationId?: string, days: number = 30) {
  return useQuery({
    queryKey: ['promotion-redemptions', organizationId, days],
    queryFn: async () => {
      if (!organizationId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('promotion_redemptions' as any)
        .select(`
          *,
          promotion:promotion_id (name, promotion_type),
          voucher:voucher_id (code, voucher_type)
        `)
        .eq('organization_id', organizationId)
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

export function usePromotionPerformance(organizationId?: string, days: number = 30) {
  return useQuery({
    queryKey: ['promotion-performance', organizationId, days],
    queryFn: async () => {
      if (!organizationId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all redemptions grouped by promotion
      const { data: redemptions, error } = await supabase
        .from('promotion_redemptions' as any)
        .select(`
          promotion_id,
          original_amount,
          discount_applied,
          final_amount,
          promotion:promotion_id (name, promotion_type)
        `)
        .eq('organization_id', organizationId)
        .gte('transaction_date', startDate.toISOString())
        .not('promotion_id', 'is', null);

      if (error) throw error;

      // Group and aggregate by promotion
      const promotionStats = (redemptions || []).reduce((acc: Record<string, any>, r: any) => {
        const promoId = r.promotion_id;
        if (!acc[promoId]) {
          acc[promoId] = {
            promotionId: promoId,
            promotionName: r.promotion?.name || 'Unknown',
            promotionType: r.promotion?.promotion_type,
            uses: 0,
            totalOriginal: 0,
            totalDiscount: 0,
            totalFinal: 0,
          };
        }
        acc[promoId].uses += 1;
        acc[promoId].totalOriginal += Number(r.original_amount || 0);
        acc[promoId].totalDiscount += Number(r.discount_applied || 0);
        acc[promoId].totalFinal += Number(r.final_amount || 0);
        return acc;
      }, {});

      return Object.values(promotionStats);
    },
    enabled: !!organizationId,
  });
}
