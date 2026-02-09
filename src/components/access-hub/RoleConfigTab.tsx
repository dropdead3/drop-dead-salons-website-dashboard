import { useState } from 'react';
import { Tabs, TabsContent, SubTabsList, SubTabsTrigger } from '@/components/ui/tabs';
import { RoleEditor } from '@/components/dashboard/RoleEditor';
import { RoleTemplatesManager } from '@/components/dashboard/RoleTemplatesManager';
import { SystemDefaultsConfigurator } from '@/components/dashboard/settings/SystemDefaultsConfigurator';
import { ResponsibilitiesSubTab } from './ResponsibilitiesSubTab';
import { Settings2, Files, RotateCcw, Award } from 'lucide-react';

interface RoleConfigTabProps {
  canManage: boolean;
}

export function RoleConfigTab({ canManage }: RoleConfigTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('roles');

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <SubTabsList>
          <SubTabsTrigger value="roles" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Roles
          </SubTabsTrigger>
          <SubTabsTrigger value="responsibilities" className="gap-2">
            <Award className="h-4 w-4" />
            Responsibilities
          </SubTabsTrigger>
          <SubTabsTrigger value="templates" className="gap-2">
            <Files className="h-4 w-4" />
            Templates
          </SubTabsTrigger>
          <SubTabsTrigger value="defaults" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Defaults
          </SubTabsTrigger>
        </SubTabsList>

        <TabsContent value="roles" className="mt-6">
          <RoleEditor />
        </TabsContent>

        <TabsContent value="responsibilities" className="mt-6">
          <ResponsibilitiesSubTab canManage={canManage} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <RoleTemplatesManager />
        </TabsContent>

        <TabsContent value="defaults" className="mt-6">
          <SystemDefaultsConfigurator />
        </TabsContent>
      </Tabs>
    </div>
  );
}