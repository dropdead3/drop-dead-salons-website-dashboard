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
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { PlatformButton } from '../ui/PlatformButton';
import { usePlatformBranding } from '@/hooks/usePlatformBranding';
import { usePlatformTheme } from '@/contexts/PlatformThemeContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { usePlatformPresenceContext } from '@/contexts/PlatformPresenceContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from '../ui/OnlineIndicator';
import { PlatformBadge } from '../ui/PlatformBadge';
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

const platformNavItems: NavItem[] = [
  { href: '/dashboard/platform/overview', label: 'Overview', icon: Terminal },
  { href: '/dashboard/platform/accounts', label: 'Accounts', icon: Building2 },
  { href: '/dashboard/platform/onboarding', label: 'Onboarding', icon: Rocket, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
  { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload },
  { href: '/dashboard/platform/audit-log', label: 'Audit Log', icon: FileText, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
  { href: '/dashboard/platform/jobs', label: 'Scheduled Jobs', icon: Clock, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
  { href: '/dashboard/platform/health', label: 'System Health', icon: Activity, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
  { href: '/dashboard/platform/stripe-health', label: 'Payments Health', icon: CreditCard, platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] },
  { href: '/dashboard/platform/notifications', label: 'Notifications', icon: Bell, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/analytics', label: 'Analytics', icon: BarChart3, platformRoles: ['platform_owner'] },
  { href: '/dashboard/platform/knowledge-base', label: 'Knowledge Base', icon: BookOpen, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/revenue', label: 'Revenue', icon: DollarSign, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/permissions', label: 'Permissions', icon: Shield, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/settings', label: 'Settings', icon: Settings, platformRoles: ['platform_owner', 'platform_admin'] },
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
  
  // Get the highest priority role for display
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

  // Filter nav items based on platform role hierarchy
  const visibleItems = platformNavItems.filter(item => {
    if (!item.platformRoles || item.platformRoles.length === 0) return true;
    return item.platformRoles.some(role => hasPlatformRoleOrHigher(role));
  });

  // Choose logo based on theme
  // Dark mode: use primary_logo_url (light/white logo)
  // Light mode: use secondary_logo_url (dark logo)
  const currentLogo = resolvedTheme === 'dark' 
    ? branding.primary_logo_url 
    : branding.secondary_logo_url;
  
  // Choose icon based on theme (for collapsed sidebar)
  // Dark mode: use icon_dark_url (light/white icon)
  // Light mode: use icon_light_url (dark icon)
  const currentIcon = resolvedTheme === 'dark'
    ? branding.icon_dark_url
    : branding.icon_light_url;

  const isDark = resolvedTheme === 'dark';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
        isDark 
          ? 'border-slate-700/50 bg-slate-900/95 backdrop-blur-xl'
          : 'border-violet-200/50 bg-white/95 backdrop-blur-xl shadow-lg shadow-violet-500/5'
      )}
    >
      {/* Logo / Header */}
      <div className={cn(
        'flex h-16 items-center justify-between border-b px-4',
        isDark ? 'border-slate-700/50' : 'border-violet-200/50'
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
                  isDark 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20'
                    : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30'
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
                isDark 
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30'
              )}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? isDark
                        ? 'bg-violet-500/20 text-violet-300 shadow-sm shadow-violet-500/10'
                        : 'bg-violet-100 text-violet-700 shadow-sm shadow-violet-500/10'
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    'h-5 w-5 shrink-0',
                    isActive 
                      ? isDark ? 'text-violet-400' : 'text-violet-600'
                      : ''
                  )} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className={cn(
        'border-t p-3',
        isDark ? 'border-slate-700/50' : 'border-violet-200/50'
      )}>
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

      {/* Collapse Toggle */}
      <div className={cn(
        'border-t p-3',
        isDark ? 'border-slate-700/50' : 'border-violet-200/50'
      )}>
        <PlatformButton
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-center',
            !collapsed && 'justify-start gap-2',
            isDark 
              ? 'text-slate-400 hover:text-white' 
              : 'text-slate-500 hover:text-violet-700 hover:bg-violet-50'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </PlatformButton>
      </div>
    </aside>
  );
}
