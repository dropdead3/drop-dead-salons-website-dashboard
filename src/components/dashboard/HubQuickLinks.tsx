import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  LayoutGrid,
  DollarSign,
  Store,
  Globe,
  ClipboardList,
  CalendarClock,
  MessageSquarePlus,
  Shield,
} from 'lucide-react';

export interface HubLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: string;
  permission?: string;
}

export const hubLinks: HubLinkProps[] = [
  { 
    href: '/dashboard/admin/analytics', 
    icon: TrendingUp, 
    label: 'Analytics Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'view_team_overview',
  },
  { 
    href: '/dashboard/admin/management', 
    icon: LayoutGrid, 
    label: 'Management Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'view_team_overview',
  },
  { 
    href: '/dashboard/admin/payroll', 
    icon: DollarSign, 
    label: 'Hiring & Payroll Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'manage_payroll',
  },
  { 
    href: '/dashboard/admin/booth-renters', 
    icon: Store, 
    label: 'Renter Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'manage_booth_renters',
  },
  { 
    href: '/dashboard/admin/website-sections', 
    icon: Globe, 
    label: 'Website Editor', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'manage_homepage_stylists',
  },
  { 
    href: '/dashboard/admin/feedback', 
    icon: MessageSquarePlus, 
    label: 'Feedback Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'manage_settings',
  },
  { 
    href: '/dashboard/admin/access-hub', 
    icon: Shield, 
    label: 'Roles Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'manage_settings',
  },
  {
    href: '/dashboard/admin/onboarding-tracker', 
    icon: ClipboardList, 
    label: 'Onboarding Hub', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'view_team_overview',
  },
  { 
    href: '/dashboard/schedule-meeting', 
    icon: CalendarClock, 
    label: 'Schedule 1:1', 
    colorClass: 'bg-primary/5 text-primary hover:bg-primary/10',
    permission: 'schedule_meetings',
  },
];

interface HubQuickLinksProps {
  hubOrder?: string[];
  enabledHubs?: string[];
}

export function HubQuickLinks({ hubOrder, enabledHubs }: HubQuickLinksProps) {
  const { hasPermission } = useAuth();

  // Filter by permission first
  const permittedHubs = hubLinks.filter(hub => 
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
