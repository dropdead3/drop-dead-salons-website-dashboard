import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Armchair, FileText } from 'lucide-react';
import { ChairManager } from '@/components/dashboard/day-rate/ChairManager';
import { AgreementEditor } from '@/components/dashboard/day-rate/AgreementEditor';

export function DayRateSettingsContent() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="chairs" className="w-full">
        <TabsList>
          <TabsTrigger value="chairs" className="flex items-center gap-2">
            <Armchair className="w-4 h-4" />
            Chair Inventory
          </TabsTrigger>
          <TabsTrigger value="agreement" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Agreement
          </TabsTrigger>
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
