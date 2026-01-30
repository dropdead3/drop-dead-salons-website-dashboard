import { useLocation } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { PlatformButton } from '../ui/PlatformButton';
import { usePlatformBranding } from '@/hooks/usePlatformBranding';
import { usePlatformTheme } from '@/contexts/PlatformThemeContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  platformRoles?: Array<'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer'>;
}

const platformNavItems: NavItem[] = [
  { href: '/dashboard/platform/overview', label: 'Overview', icon: Terminal },
  { href: '/dashboard/platform/accounts', label: 'Accounts', icon: Building2 },
  { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload },
  { href: '/dashboard/platform/revenue', label: 'Revenue', icon: DollarSign, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/permissions', label: 'Permissions', icon: Shield, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/settings', label: 'Settings', icon: Settings, platformRoles: ['platform_owner', 'platform_admin'] },
];

const SIDEBAR_COLLAPSED_KEY = 'platform-sidebar-collapsed';

export function PlatformSidebar() {
  const location = useLocation();
  const { hasPlatformRoleOrHigher } = useAuth();
  const { branding } = usePlatformBranding();
  const { resolvedTheme } = usePlatformTheme();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

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
  
  const currentIcon = resolvedTheme === 'dark'
    ? branding.primary_logo_url // Using same for now, could add icon variants
    : branding.secondary_logo_url;

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
