import { useSearchParams } from 'react-router-dom';
import { Store, Users, Receipt } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RentersTabContent, PaymentsTabContent } from '@/components/dashboard/booth-renters';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformPageHeader } from '@/components/platform/ui/PlatformPageHeader';

// TODO: Get from organization context when available
const DEFAULT_ORG_ID = 'drop-dead-salons';

export default function BoothRenters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'renters';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <PlatformPageContainer className="space-y-6">
      <PlatformPageHeader
        title="Renter Hub"
        description="Manage booth renters and rent payments"
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        actions={
          <Store className="h-6 w-6 text-primary" />
        }
      />

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="renters" className="gap-2">
            <Users className="h-4 w-4" />
            Renters
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Receipt className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="renters">
          <RentersTabContent organizationId={DEFAULT_ORG_ID} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTabContent organizationId={DEFAULT_ORG_ID} />
        </TabsContent>
      </Tabs>
    </PlatformPageContainer>
  );
}
