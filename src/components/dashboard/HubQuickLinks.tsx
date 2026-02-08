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

interface HubLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: string;
  permission?: string;
}

const hubLinks: HubLinkProps[] = [
  { 
    href: '/dashboard/admin/analytics', 
    icon: TrendingUp, 
    label: 'Analytics Hub', 
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20',
    permission: 'view_team_overview',
  },
  { 
    href: '/dashboard/admin/management', 
    icon: LayoutGrid, 
    label: 'Management Hub', 
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20',
    permission: 'view_team_overview',
  },
  { 
    href: '/dashboard/admin/payroll', 
    icon: DollarSign, 
    label: 'Payroll Hub', 
    colorClass: 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20',
    permission: 'manage_payroll',
  },
  { 
    href: '/dashboard/admin/booth-renters', 
    icon: Store, 
    label: 'Renter Hub', 
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
    permission: 'manage_booth_renters',
  },
  { 
    href: '/dashboard/admin/website-sections', 
    icon: Globe, 
    label: 'Website Editor', 
    colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20',
    permission: 'manage_homepage_stylists',
  },
  { 
    href: '/dashboard/admin/feedback', 
    icon: MessageSquarePlus, 
    label: 'Feedback Hub', 
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
    permission: 'manage_settings',
  },
  { 
    href: '/dashboard/admin/access-hub', 
    icon: Shield, 
    label: 'Access Hub', 
    colorClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
    permission: 'manage_settings',
  },
  {
    href: '/dashboard/admin/onboarding-tracker', 
    icon: ClipboardList, 
    label: 'Onboarding Hub', 
    colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20',
    permission: 'view_team_overview',
  },
  { 
    href: '/dashboard/schedule-meeting', 
    icon: CalendarClock, 
    label: 'Schedule 1:1', 
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20',
    permission: 'schedule_meetings',
  },
];

export function HubQuickLinks() {
  const { hasPermission } = useAuth();

  // Filter to only show hubs the user has permission for
  const visibleHubs = hubLinks.filter(hub => 
    !hub.permission || hasPermission(hub.permission)
  );

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
