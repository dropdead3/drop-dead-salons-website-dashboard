import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { hubLinksConfig } from '@/config/dashboardNav';

export type { HubLinkConfig as HubLinkProps } from '@/config/dashboardNav';

/** @deprecated Import hubLinksConfig from '@/config/dashboardNav'. Re-exported for backward compatibility. */
export const hubLinks = hubLinksConfig;

interface HubQuickLinksProps {
  hubOrder?: string[];
  enabledHubs?: string[];
}

export function HubQuickLinks({ hubOrder, enabledHubs }: HubQuickLinksProps) {
  const { hasPermission } = useAuth();

  // Filter by permission first (from canonical nav registry)
  const permittedHubs = hubLinksConfig.filter(hub => 
    !hub.permission || hasPermission(hub.permission)
  );

  // Apply custom order and visibility
  const visibleHubs = useMemo(() => {
    let filtered = permittedHubs;
    
    // Filter to only enabled hubs if specified (empty array = hide all)
    if (enabledHubs !== undefined) {
      filtered = filtered.filter(hub => enabledHubs.includes(hub.href));
    }
    
    // Apply custom order if specified
    if (hubOrder && hubOrder.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        const aIndex = hubOrder.indexOf(a.href);
        const bIndex = hubOrder.indexOf(b.href);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
    
    return filtered;
  }, [permittedHubs, hubOrder, enabledHubs]);

  if (visibleHubs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-sm tracking-wide text-muted-foreground uppercase">Quick Access Hubs</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {visibleHubs.map((hub) => (
          <Link
            key={hub.href}
            to={hub.href}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
              "border border-border/50 hover:border-border",
              "hover:shadow-md hover:-translate-y-0.5",
              hub.colorClass
            )}
          >
            <hub.icon className="w-6 h-6" />
            <span className="text-xs font-medium text-center text-foreground">{hub.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
