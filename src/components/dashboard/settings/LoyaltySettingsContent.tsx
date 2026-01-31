import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Crown, Sparkles, CreditCard, Package, Percent, BarChart3 } from 'lucide-react';
import { LoyaltyProgramConfigurator } from '@/components/dashboard/loyalty/LoyaltyProgramConfigurator';
import { LoyaltyTiersEditor } from '@/components/dashboard/loyalty/LoyaltyTiersEditor';
import { GiftCardDesignEditor } from '@/components/dashboard/loyalty/GiftCardDesignEditor';
import { PhysicalCardOrderForm } from '@/components/dashboard/loyalty/PhysicalCardOrderForm';
import { PhysicalCardOrderHistory } from '@/components/dashboard/loyalty/PhysicalCardOrderHistory';
import { PromotionsConfigurator } from '@/components/dashboard/promotions/PromotionsConfigurator';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export function LoyaltySettingsContent() {
  const [activeTab, setActiveTab] = useState('program');
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="program" className="gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Program</span>
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Tiers</span>
          </TabsTrigger>
          <TabsTrigger value="promos" className="gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Promos</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </TabsTrigger>
          <TabsTrigger value="order" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Order</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="mt-6">
          <LoyaltyProgramConfigurator organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="tiers" className="mt-6">
          <LoyaltyTiersEditor organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="promos" className="mt-6">
          <PromotionsConfigurator organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="design" className="mt-6">
          <GiftCardDesignEditor organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="print" className="mt-6">
          <PhysicalCardOrderForm organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="order" className="mt-6">
          <PhysicalCardOrderHistory organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
