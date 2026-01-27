import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Armchair, FileText, CalendarOff } from 'lucide-react';
import { ChairManager } from '@/components/dashboard/day-rate/ChairManager';
import { AgreementEditor } from '@/components/dashboard/day-rate/AgreementEditor';
import { VisibilityGate } from '@/components/visibility/VisibilityGate';

export default function DayRateSettings() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide">DAY RATE SETTINGS</h1>
        <p className="text-muted-foreground">
          Configure chair inventory, pricing, and rental agreements
        </p>
      </div>

      <Tabs defaultValue="chairs" className="w-full">
        <TabsList>
          <VisibilityGate elementKey="dayrate_chairs_tab" elementName="Chair Inventory" elementCategory="Page Tabs">
            <TabsTrigger value="chairs" className="flex items-center gap-2">
              <Armchair className="w-4 h-4" />
              Chair Inventory
            </TabsTrigger>
          </VisibilityGate>
          <VisibilityGate elementKey="dayrate_agreement_tab" elementName="Agreement" elementCategory="Page Tabs">
            <TabsTrigger value="agreement" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Agreement
            </TabsTrigger>
          </VisibilityGate>
        </TabsList>

        <TabsContent value="chairs" className="mt-6">
          <ChairManager />
        </TabsContent>

        <TabsContent value="agreement" className="mt-6">
          <AgreementEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
