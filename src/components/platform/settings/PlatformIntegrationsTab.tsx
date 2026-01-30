import { PLATFORM_INTEGRATIONS } from '@/config/platformIntegrations';
import { PlatformIntegrationCard } from './PlatformIntegrationCard';
import { usePandaDocStats } from '@/hooks/usePandaDocStats';

export function PlatformIntegrationsTab() {
  const { data: pandaDocStats } = usePandaDocStats();

  // Determine PandaDoc status dynamically
  const getPandaDocStatus = (): 'connected' | 'not_configured' => {
    if (pandaDocStats && pandaDocStats.totalDocuments > 0) return 'connected';
    return 'not_configured';
  };

  // Separate active and coming soon integrations
  const activeIntegrations = PLATFORM_INTEGRATIONS.filter(i => i.status !== 'coming_soon');
  const comingSoonIntegrations = PLATFORM_INTEGRATIONS.filter(i => i.status === 'coming_soon');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Integrations</h2>
        <p className="text-slate-400">
          Connect and manage third-party services for platform operations
        </p>
      </div>

      {/* Active Integrations */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">
          Active Integrations
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeIntegrations.map(integration => (
            <PlatformIntegrationCard
              key={integration.id}
              integration={integration}
              status={integration.id === 'pandadoc' ? getPandaDocStatus() : undefined}
              stats={
                integration.id === 'pandadoc' && pandaDocStats
                  ? {
                      primary: { label: 'documents', value: pandaDocStats.totalDocuments },
                      secondary: { label: 'pending', value: pandaDocStats.pendingDocuments },
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      {comingSoonIntegrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">
            Coming Soon
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoonIntegrations.map(integration => (
              <PlatformIntegrationCard
                key={integration.id}
                integration={integration}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
