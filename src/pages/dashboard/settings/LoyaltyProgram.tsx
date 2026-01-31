import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, 
  Star, 
  Crown, 
  Sparkles,
  CreditCard,
  Package
} from 'lucide-react';
import { LoyaltyProgramConfigurator } from '@/components/dashboard/loyalty/LoyaltyProgramConfigurator';
import { LoyaltyTiersEditor } from '@/components/dashboard/loyalty/LoyaltyTiersEditor';
import { GiftCardDesignEditor } from '@/components/dashboard/loyalty/GiftCardDesignEditor';
import { PhysicalCardOrderForm } from '@/components/dashboard/loyalty/PhysicalCardOrderForm';
import { PhysicalCardOrderHistory } from '@/components/dashboard/loyalty/PhysicalCardOrderHistory';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export default function LoyaltyProgram() {
  const [activeTab, setActiveTab] = useState('program');
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-medium flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Loyalty & Rewards
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your client loyalty program and gift card designs
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="program" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Program</span>
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Tiers</span>
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

          <TabsContent value="program">
            <LoyaltyProgramConfigurator organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="tiers">
            <LoyaltyTiersEditor organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="design">
            <GiftCardDesignEditor organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="print">
            <PhysicalCardOrderForm organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="order">
            <PhysicalCardOrderHistory organizationId={organizationId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
