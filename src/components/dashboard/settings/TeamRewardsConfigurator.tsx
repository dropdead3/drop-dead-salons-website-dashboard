import { Tabs, TabsContent, TabsTrigger, ResponsiveTabsList } from '@/components/ui/tabs';
import { Gift, Sparkles, Clock, BarChart3 } from 'lucide-react';
import {
  RewardsCatalogTab,
  EarningRulesTab,
  RedemptionApprovalsTab,
  RewardsAnalyticsTab,
} from '@/components/rewards-config';
import { usePendingRedemptions } from '@/hooks/usePoints';
import { Badge } from '@/components/ui/badge';

export function TeamRewardsConfigurator() {
  const { data: pendingRedemptions = [] } = usePendingRedemptions();

  return (
    <Tabs defaultValue="catalog" className="space-y-6">
      <ResponsiveTabsList>
        <TabsTrigger value="catalog" className="gap-2">
          <Gift className="w-4 h-4" />
          <span className="hidden sm:inline">Catalog</span>
        </TabsTrigger>
        <TabsTrigger value="earning" className="gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Earning</span>
        </TabsTrigger>
        <TabsTrigger value="approvals" className="gap-2 relative">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Approvals</span>
          {pendingRedemptions.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {pendingRedemptions.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Analytics</span>
        </TabsTrigger>
      </ResponsiveTabsList>

      <TabsContent value="catalog" className="mt-6">
        <RewardsCatalogTab />
      </TabsContent>

      <TabsContent value="earning" className="mt-6">
        <EarningRulesTab />
      </TabsContent>

      <TabsContent value="approvals" className="mt-6">
        <RedemptionApprovalsTab />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <RewardsAnalyticsTab />
      </TabsContent>
    </Tabs>
  );
}
