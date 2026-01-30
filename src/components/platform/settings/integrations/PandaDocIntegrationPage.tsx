import { PlatformPageHeader } from '../../ui/PlatformPageHeader';
import { PandaDocStatusCard } from '../PandaDocStatusCard';
import { PandaDocFieldMappingEditor } from '../PandaDocFieldMappingEditor';

export function PandaDocIntegrationPage() {
  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="PandaDoc Integration"
        description="Automate contract signing and billing configuration"
        backTo="/dashboard/platform/settings"
        backLabel="Back to Integrations"
      />
      
      <PandaDocStatusCard />
      <PandaDocFieldMappingEditor />
    </div>
  );
}
