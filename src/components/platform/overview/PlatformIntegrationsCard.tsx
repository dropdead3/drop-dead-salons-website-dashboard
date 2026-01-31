import { Link } from 'react-router-dom';
import { ArrowRight, Plug } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformBadge } from '@/components/platform/ui/PlatformBadge';
import { usePlatformIntegrationStats, IntegrationStat } from '@/hooks/usePlatformIntegrationStats';

export function PlatformIntegrationsCard() {
  const { data: stats, isLoading } = usePlatformIntegrationStats();

  if (isLoading) {
    return <PlatformIntegrationsCardSkeleton />;
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/20">
            <Plug className="h-4 w-4 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Integrations Health</h2>
        </div>
        <Link 
          to="/dashboard/platform/settings"
          className="text-sm text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-1"
        >
          See All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Integration List */}
      <div className="space-y-3">
        {stats?.integrations.map((integration) => (
          <IntegrationRow key={integration.id} integration={integration} />
        ))}
      </div>

      {/* Footer Summary */}
      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <p className="text-sm text-slate-400">
          <span className="text-white font-medium">{stats?.totalActive}</span> of{' '}
          <span className="text-white font-medium">{stats?.totalAvailable}</span> integrations active
        </p>
      </div>
    </div>
  );
}

interface IntegrationRowProps {
  integration: IntegrationStat;
}

function IntegrationRow({ integration }: IntegrationRowProps) {
  const Icon = integration.icon;
  
  const badgeVariant = {
    healthy: 'success' as const,
    issues: 'warning' as const,
    not_configured: 'default' as const,
  };

  const badgeLabel = {
    healthy: 'Healthy',
    issues: 'Issues',
    not_configured: 'Not configured',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/40 transition-colors">
      <div className="p-2 rounded-lg bg-slate-600/50">
        <Icon className="h-4 w-4 text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{integration.name}</p>
        <p className="text-xs text-slate-400 truncate">{integration.details}</p>
      </div>
      <PlatformBadge variant={badgeVariant[integration.status]} size="sm">
        {badgeLabel[integration.status]}
      </PlatformBadge>
    </div>
  );
}

function PlatformIntegrationsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-xl bg-slate-700/50" />
          <Skeleton className="h-5 w-36 bg-slate-700/50" />
        </div>
        <Skeleton className="h-4 w-16 bg-slate-700/50" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
            <Skeleton className="h-8 w-8 rounded-lg bg-slate-700/50" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-20 bg-slate-700/50" />
              <Skeleton className="h-3 w-28 bg-slate-700/50" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full bg-slate-700/50" />
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <Skeleton className="h-4 w-40 bg-slate-700/50" />
      </div>
    </div>
  );
}
