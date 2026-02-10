import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { 
  Terminal, 
  Building2, 
  Upload, 
  DollarSign, 
  Shield, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Crown,
  Headphones,
  Code,
  BookOpen,
  Rocket,
  BarChart3,
  FileText,
  Clock,
  Activity,
  Bell,
  CreditCard,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { usePlatformBranding } from '@/hooks/usePlatformBranding';
import { usePlatformTheme } from '@/contexts/PlatformThemeContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { usePlatformPresenceContext } from '@/contexts/PlatformPresenceContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from '../ui/OnlineIndicator';
import { PlatformBadge } from '../ui/PlatformBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlatformRole } from '@/hooks/usePlatformRoles';

const roleConfig: Record<PlatformRole, { label: string; icon: React.ComponentType<{ className?: string }>; variant: 'warning' | 'info' | 'success' | 'primary' }> = {
  platform_owner: { label: 'Owner', icon: Crown, variant: 'warning' },
  platform_admin: { label: 'Admin', icon: Shield, variant: 'info' },
  platform_support: { label: 'Support', icon: Headphones, variant: 'success' },
  platform_developer: { label: 'Developer', icon: Code, variant: 'primary' },
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  platformRoles?: Array<'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer'>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard/platform/overview', label: 'Overview', icon: Terminal },
      { href: '/dashboard/platform/accounts', label: 'Accounts', icon: Building2 },
      { href: '/dashboard/platform/health-scores', label: 'Health Scores', icon: Activity, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
      { href: '/dashboard/platform/benchmarks', label: 'Benchmarks', icon: BarChart3, platformRoles: ['platform_owner', 'platform_admin'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/dashboard/platform/onboarding', label: 'Onboarding', icon: Rocket, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
      { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload },
      { href: '/dashboard/platform/jobs', label: 'Scheduled Jobs', icon: Clock, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/dashboard/platform/audit-log', label: 'Audit Log', icon: FileText, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
      { href: '/dashboard/platform/health', label: 'System Health', icon: Activity, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
      { href: '/dashboard/platform/stripe-health', label: 'Payments Health', icon: CreditCard, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
      { href: '/dashboard/platform/notifications', label: 'Notifications', icon: Bell, platformRoles: ['platform_owner', 'platform_admin'] },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/dashboard/platform/analytics', label: 'Analytics', icon: BarChart3, platformRoles: ['platform_owner'] },
      { href: '/dashboard/platform/knowledge-base', label: 'Knowledge Base', icon: BookOpen, platformRoles: ['platform_owner', 'platform_admin'] },
      { href: '/dashboard/platform/revenue', label: 'Revenue', icon: DollarSign, platformRoles: ['platform_owner', 'platform_admin'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/dashboard/platform/permissions', label: 'Permissions', icon: Shield, platformRoles: ['platform_owner', 'platform_admin'] },
      { href: '/dashboard/platform/feature-flags', label: 'Feature Flags', icon: Flag, platformRoles: ['platform_owner', 'platform_admin'] },
      { href: '/dashboard/platform/settings', label: 'Settings', icon: Settings, platformRoles: ['platform_owner', 'platform_admin'] },
    ],
  },
];

const SIDEBAR_COLLAPSED_KEY = 'platform-sidebar-collapsed';

export function PlatformSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPlatformRoleOrHigher, platformRoles } = useAuth();
  const { branding } = usePlatformBranding();
  const { resolvedTheme } = usePlatformTheme();
  const { data: profile } = useEmployeeProfile();
  const { isConnected } = usePlatformPresenceContext();
  
  const primaryRole = platformRoles[0] as PlatformRole | undefined;
  const roleInfo = primaryRole ? roleConfig[primaryRole] : null;
  
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const getInitials = () => {
    const name = profile?.full_name || profile?.display_name || user?.email;
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isDark = resolvedTheme === 'dark';

  // Filter groups to only show items the user has access to
  const visibleGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!item.platformRoles || item.platformRoles.length === 0) return true;
        return item.platformRoles.some(role => hasPlatformRoleOrHigher(role));
      }),
    }))
    .filter(group => group.items.length > 0);

  // Choose logo based on theme
  const currentLogo = resolvedTheme === 'dark' 
    ? branding.primary_logo_url 
    : branding.secondary_logo_url;
  
  const currentIcon = resolvedTheme === 'dark'
    ? branding.icon_dark_url
    : branding.icon_light_url;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
        isDark 
          ? 'bg-slate-900/95 backdrop-blur-xl'
          : 'bg-white/95 backdrop-blur-xl shadow-lg shadow-violet-500/5'
      )}
    >
      {/* Logo / Header with collapse toggle */}
      <div className={cn(
        'flex h-[60px] items-center justify-between px-4 shrink-0',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Platform logo"
                className="h-8 object-contain"
              />
            ) : (
              <>
                <div className={cn(
                  'p-1.5 rounded-lg shadow-lg',
                  'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20'
                )}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className={cn(
                  'font-display',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>Platform</span>
              </>
            )}
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            {currentIcon ? (
              <img
                src={currentIcon}
                alt="Platform icon"
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div className={cn(
                'p-1.5 rounded-lg shadow-lg',
                'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20'
              )}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className={cn(
              'p-1 rounded-md transition-colors duration-200',
              isDark 
                ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60' 
                : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(false)}
                className={cn(
                  'absolute -right-3 top-[18px] z-50 p-1 rounded-full border shadow-sm transition-colors duration-200',
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' 
                    : 'bg-white border-violet-200 text-slate-400 hover:text-violet-600 hover:bg-violet-50'
                )}
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Header fade divider */}
      <div className={cn(
        'h-px mx-3 shrink-0',
        isDark 
          ? 'bg-gradient-to-r from-transparent via-slate-700/60 to-transparent'
          : 'bg-gradient-to-r from-transparent via-violet-200/60 to-transparent'
      )} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto relative">
        <div className={cn('py-3 space-y-4', collapsed ? 'px-1' : 'px-2')}>
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {/* Section label */}
              {!collapsed && (
                <div className={cn(
                  'px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider',
                  isDark ? 'text-slate-500' : 'text-slate-400'
                )}>
                  {group.label}
                </div>
              )}

              {/* Collapsed: thin separator between groups */}
              {collapsed && groupIndex > 0 && (
                <div className={cn(
                  'h-px mx-2 mb-2',
                  isDark ? 'bg-slate-700/40' : 'bg-violet-100/60'
                )} />
              )}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  const linkContent = (
                    <NavLink
                      to={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out',
                        collapsed && 'justify-center px-2',
                        !collapsed && 'hover:translate-x-0.5',
                        isActive
                          ? isDark
                            ? 'bg-violet-500/15 text-violet-300'
                            : 'bg-violet-100/80 text-violet-700'
                          : isDark
                            ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                            : 'text-slate-500 hover:bg-violet-50/80 hover:text-violet-700'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Active accent bar */}
                      {isActive && (
                        <div className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full',
                          isDark ? 'bg-violet-400' : 'bg-violet-500'
                        )} />
                      )}
                      <Icon className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        isActive 
                          ? isDark ? 'text-violet-400' : 'text-violet-600'
                          : ''
                      )} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return <li key={item.href}>{linkContent}</li>;
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Scroll fade hint */}
        <div className={cn(
          'sticky bottom-0 left-0 right-0 h-6 pointer-events-none',
          isDark
            ? 'bg-gradient-to-t from-slate-900/95 to-transparent'
            : 'bg-gradient-to-t from-white/95 to-transparent'
        )} />
      </nav>

      {/* User Profile Section */}
      <div className={cn(
        'shrink-0 p-3',
      )}>
        {/* Profile divider */}
        <div className={cn(
          'h-px mx-1 mb-3',
          isDark 
            ? 'bg-gradient-to-r from-transparent via-slate-700/60 to-transparent'
            : 'bg-gradient-to-r from-transparent via-violet-200/60 to-transparent'
        )} />
        <button
          onClick={() => navigate('/dashboard/platform/settings')}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200',
            collapsed && 'justify-center',
            isDark 
              ? 'hover:bg-slate-800/60' 
              : 'hover:bg-violet-50'
          )}
          title={collapsed ? (profile?.display_name || profile?.full_name || 'Account') : undefined}
        >
          <Avatar className={cn(
              'h-8 w-8 border',
              isDark ? 'border-slate-600' : 'border-violet-200'
            )}>
              <AvatarImage src={profile?.photo_url || undefined} alt="Profile" />
              <AvatarFallback className={cn(
                'text-xs font-medium',
                isDark ? 'bg-slate-700 text-slate-300' : 'bg-violet-100 text-violet-700'
              )}>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={cn(
                  'text-sm font-medium truncate',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>
                  {profile?.display_name || profile?.full_name?.split(' ')[0] || 'Account'}
                </p>
                {isConnected && (
                  <OnlineIndicator isOnline={true} size="sm" />
                )}
              </div>
              {roleInfo && (
                <PlatformBadge variant={roleInfo.variant} size="sm" className="gap-1 mt-0.5">
                  <roleInfo.icon className="w-2.5 h-2.5" />
                  {roleInfo.label}
                </PlatformBadge>
              )}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
