import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ExternalLink, Rocket, ChevronRight } from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';
import LogoWhite from '@/assets/drop-dead-logo-white.svg';
import { SidebarAnnouncementsWidget } from './SidebarAnnouncementsWidget';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: string[];
}

interface OnboardingProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
}

interface SidebarNavContentProps {
  mainNavItems: NavItem[];
  growthNavItems: NavItem[];
  statsNavItems: NavItem[];
  getHelpNavItems: NavItem[];
  housekeepingNavItems: NavItem[];
  managerNavItems: NavItem[];
  websiteNavItems: NavItem[];
  adminOnlyNavItems: NavItem[];
  unreadCount: number;
  roles: string[];
  effectiveIsCoach: boolean;
  filterNavItems: (items: NavItem[]) => NavItem[];
  onNavClick: () => void;
  isOnboardingComplete: boolean;
  onboardingProgress?: OnboardingProgress;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SIDEBAR_SCROLL_KEY = 'dashboard-sidebar-scroll';

const SidebarNavContent = forwardRef<HTMLElement, SidebarNavContentProps>((
  {
    mainNavItems,
    growthNavItems,
    statsNavItems,
    getHelpNavItems,
    housekeepingNavItems,
    managerNavItems,
    websiteNavItems,
    adminOnlyNavItems,
    unreadCount,
    roles,
    effectiveIsCoach,
    filterNavItems,
    onNavClick,
    isOnboardingComplete,
    onboardingProgress,
    isCollapsed = false,
    onToggleCollapse,
  }, ref) => {
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const internalRef = useRef<HTMLElement>(null);
  const { data: businessSettings } = useBusinessSettings();
  
  // Check if custom logos are uploaded
  const hasCustomLogo = () => {
    const isDark = resolvedTheme === 'dark';
    const customLogo = isDark ? businessSettings?.logo_dark_url : businessSettings?.logo_light_url;
    return !!customLogo;
  };
  
  // Get the appropriate logo based on theme and settings
  const getLogo = () => {
    const isDark = resolvedTheme === 'dark';
    const customLogo = isDark ? businessSettings?.logo_dark_url : businessSettings?.logo_light_url;
    const fallbackLogo = isDark ? LogoWhite : Logo;
    return customLogo || fallbackLogo;
  };
  
  // Expose the internal ref
  useImperativeHandle(ref, () => internalRef.current!, []);

  // Track scroll position
  useEffect(() => {
    const nav = internalRef.current;
    if (!nav) return;
    
    const handleScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
    };
    
    nav.addEventListener('scroll', handleScroll, { passive: true });
    return () => nav.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position on mount and after navigation
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (!savedPosition) return;
    
    const scrollPos = parseInt(savedPosition, 10);
    if (isNaN(scrollPos) || scrollPos === 0) return;

    const restoreScroll = () => {
      if (internalRef.current) {
        internalRef.current.scrollTop = scrollPos;
      }
    };
    
    // Multiple attempts to ensure content is ready
    restoreScroll();
    requestAnimationFrame(restoreScroll);
    const timer1 = setTimeout(restoreScroll, 50);
    const timer2 = setTimeout(restoreScroll, 150);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname]);

  const NavLink = ({ 
    href, 
    label, 
    icon: Icon, 
    badgeCount 
  }: { 
    href: string; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badgeCount?: number;
  }) => {
    const isActive = location.pathname === href;
    
    const linkContent = (
      <Link
        to={href}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 text-sm font-sans transition-colors",
          isCollapsed ? "px-0 py-3 justify-center" : "px-4 py-3",
          isActive 
            ? "bg-foreground text-background" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!isCollapsed && <span className="flex-1">{label}</span>}
        {!isCollapsed && badgeCount !== undefined && badgeCount > 0 && (
          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
            {badgeCount > 9 ? '9+' : badgeCount}
          </Badge>
        )}
        {isCollapsed && badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        )}
      </Link>
    );
    
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              {linkContent}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-sans">
            {label}
            {badgeCount !== undefined && badgeCount > 0 && ` (${badgeCount})`}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return linkContent;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo & Collapse Toggle */}
      <div className={cn("border-b border-border", isCollapsed ? "p-3" : "p-6")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          <Link to="/dashboard" className="block">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-display text-sm font-bold">
                    {(businessSettings?.business_name || 'DD').substring(0, 2).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{businessSettings?.business_name || 'Drop Dead'}</TooltipContent>
              </Tooltip>
            ) : hasCustomLogo() ? (
              <img 
                src={getLogo()} 
                alt={businessSettings?.business_name || 'Drop Dead'} 
                className="h-5 w-auto" 
              />
            ) : (
              <span className="font-display text-lg uppercase tracking-wider text-foreground">
                {businessSettings?.business_name || 'Drop Dead'}
              </span>
            )}
          </Link>
        </div>
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground mt-2 font-sans">
            Staff Dashboard
          </p>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && onToggleCollapse && (
        <div className="p-2 border-b border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full h-8 text-muted-foreground hover:text-foreground"
                onClick={onToggleCollapse}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Announcements Widget - at the very top (hide when collapsed) */}
      {!isCollapsed && <SidebarAnnouncementsWidget onNavClick={onNavClick} />}

      {/* Navigation */}
      <nav ref={internalRef} className="flex-1 py-4 overflow-y-auto">
        {/* START HERE Priority Section - Only shows when onboarding incomplete */}
        {!isOnboardingComplete && (
          <div className="mb-4">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/dashboard/onboarding"
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center justify-center py-3 text-sm font-sans transition-colors",
                      location.pathname === '/dashboard/onboarding'
                        ? "bg-foreground text-background" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Rocket className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  START HERE {onboardingProgress && `(${onboardingProgress.percentage}%)`}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/dashboard/onboarding"
                onClick={onNavClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-sans transition-colors",
                  location.pathname === '/dashboard/onboarding'
                    ? "bg-foreground text-background" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Rocket className="w-4 h-4" />
                <span className="flex-1 font-display">START HERE</span>
                {onboardingProgress && (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${onboardingProgress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {onboardingProgress.percentage}%
                    </span>
                  </div>
                )}
              </Link>
            )}
            <div className={cn("my-3", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
          </div>
        )}

        <div className="space-y-1">
          {filterNavItems(mainNavItems).map((item) => (
            <NavLink 
              key={item.href} 
              {...item} 
              badgeCount={item.href === '/dashboard' ? unreadCount : undefined}
            />
          ))}
        </div>

        {/* Growth Section */}
        {filterNavItems(growthNavItems).length > 0 && (
          <>
            <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
            {!isCollapsed && (
              <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
                Growth
              </p>
            )}
            <div className="space-y-1">
              {filterNavItems(growthNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Stats & Leaderboard Section */}
        {filterNavItems(statsNavItems).length > 0 && (
          <>
            <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
            {!isCollapsed && (
              <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
                Stats & Leaderboard
              </p>
            )}
            <div className="space-y-1">
              {filterNavItems(statsNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Get Help Section */}
        {filterNavItems(getHelpNavItems).length > 0 && (
          <>
            <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
            {!isCollapsed && (
              <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
                Get Help
              </p>
            )}
            <div className="space-y-1">
              {filterNavItems(getHelpNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Housekeeping Section - Filter out onboarding when incomplete (shown at top instead) */}
        {(() => {
          const filteredHousekeeping = filterNavItems(housekeepingNavItems).filter(item => 
            isOnboardingComplete || item.href !== '/dashboard/onboarding'
          );
          return filteredHousekeeping.length > 0 && (
            <>
              <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
                <div className="h-px bg-border" />
              </div>
              {!isCollapsed && (
                <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
                  Housekeeping
                </p>
              )}
              <div className="space-y-1">
                {filteredHousekeeping.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </>
          );
        })()}

        {/* Manager Section */}
        {effectiveIsCoach && filterNavItems(managerNavItems).length > 0 && (
          <>
            <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
            {!isCollapsed && (
              <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
                Management
              </p>
            )}
            <div className="space-y-1">
              {filterNavItems(managerNavItems).map((item) => (
                <NavLink 
                  key={item.href} 
                  {...item} 
                  badgeCount={item.href === '/dashboard/admin/announcements' ? unreadCount : undefined}
                />
              ))}
            </div>
          </>
        )}

        {/* Website Section */}
        {filterNavItems(websiteNavItems).length > 0 && (
          <>
            <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
            {!isCollapsed && (
              <div className="px-4 mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-foreground font-display font-medium">
                  Website
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a 
                      href="/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right">View Website</TooltipContent>
                </Tooltip>
              </div>
            )}
            <div className="space-y-1">
              {filterNavItems(websiteNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Admin Only Section */}
        {(roles.includes('admin') || roles.includes('super_admin')) && filterNavItems(adminOnlyNavItems).length > 0 && (
          <>
            <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
              <div className="h-px bg-border" />
            </div>
            {!isCollapsed && (
              <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
                Super Admin
              </p>
            )}
            <div className="space-y-1">
              {filterNavItems(adminOnlyNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>
    </div>
  );
});

SidebarNavContent.displayName = 'SidebarNavContent';

export default SidebarNavContent;
