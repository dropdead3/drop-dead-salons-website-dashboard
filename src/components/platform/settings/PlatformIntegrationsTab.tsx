import { PandaDocStatusCard } from './PandaDocStatusCard';
import { PandaDocFieldMappingEditor } from './PandaDocFieldMappingEditor';

export function PlatformIntegrationsTab() {
  return (
    <div className="space-y-6">
      <PandaDocStatusCard />
      <PandaDocFieldMappingEditor />
    </div>
  );
}
