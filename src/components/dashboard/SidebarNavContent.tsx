import { forwardRef, useEffect, useRef, useImperativeHandle, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ExternalLink, Rocket } from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';
import LogoWhite from '@/assets/drop-dead-logo-white.svg';
import { SidebarAnnouncementsWidget } from './SidebarAnnouncementsWidget';
import { ColoredLogo } from './ColoredLogo';
import { SidebarSyncStatusWidget } from './SidebarSyncStatusWidget';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useSidebarLayout, SECTION_LABELS, DEFAULT_SECTION_ORDER, DEFAULT_LINK_ORDER, isBuiltInSection, getEffectiveHiddenSections, getEffectiveHiddenLinks, anyRoleHasOverrides } from '@/hooks/useSidebarLayout';

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
  const { data: sidebarLayout } = useSidebarLayout();
  
  // Map section IDs to nav items (for built-in sections)
  const sectionItemsMap = useMemo(() => ({
    main: mainNavItems,
    growth: growthNavItems,
    stats: statsNavItems,
    getHelp: getHelpNavItems,
    housekeeping: housekeepingNavItems,
    manager: managerNavItems,
    website: websiteNavItems,
    adminOnly: adminOnlyNavItems,
  }), [mainNavItems, growthNavItems, statsNavItems, getHelpNavItems, housekeepingNavItems, managerNavItems, websiteNavItems, adminOnlyNavItems]);

  // Create a map of all nav items by href (for custom sections that can contain any link)
  const allNavItemsByHref = useMemo(() => {
    const allItems = [
      ...mainNavItems,
      ...growthNavItems,
      ...statsNavItems,
      ...getHelpNavItems,
      ...housekeepingNavItems,
      ...managerNavItems,
      ...websiteNavItems,
      ...adminOnlyNavItems,
    ];
    const map: Record<string, NavItem> = {};
    allItems.forEach(item => {
      map[item.href] = item;
    });
    return map;
  }, [mainNavItems, growthNavItems, statsNavItems, getHelpNavItems, housekeepingNavItems, managerNavItems, websiteNavItems, adminOnlyNavItems]);

  // Apply custom link ordering to nav items
  const getOrderedItems = (sectionId: string, items: NavItem[]): NavItem[] => {
    const linkOrder = sidebarLayout?.linkOrder?.[sectionId];
    if (!linkOrder || linkOrder.length === 0) return items;
    
    // Sort items based on their position in linkOrder
    return [...items].sort((a, b) => {
      const aIndex = linkOrder.indexOf(a.href);
      const bIndex = linkOrder.indexOf(b.href);
      // Items not in order go to the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  // Get section order from layout or use default, filtering out hidden sections (including role-based)
  const sectionOrder = useMemo(() => {
    const order = sidebarLayout?.sectionOrder || DEFAULT_SECTION_ORDER;
    // Get effective hidden sections based on user's roles
    const effectiveHiddenSections = getEffectiveHiddenSections(sidebarLayout, roles);
    return order.filter(id => !effectiveHiddenSections.includes(id));
  }, [sidebarLayout, roles]);

  // Get hidden links map (including role-based visibility)
  const hiddenLinks = useMemo(() => {
    return getEffectiveHiddenLinks(sidebarLayout, roles);
  }, [sidebarLayout, roles]);
  
  // Check if custom logos are uploaded
  const hasCustomLogo = () => {
    const isDark = resolvedTheme === 'dark';
    const customLogo = isDark ? businessSettings?.logo_dark_url : businessSettings?.logo_light_url;
    return !!customLogo;
  };
  
  // Check if custom icons are uploaded
  const hasCustomIcon = () => {
    const isDark = resolvedTheme === 'dark';
    const customIcon = isDark ? businessSettings?.icon_dark_url : businessSettings?.icon_light_url;
    return !!customIcon;
  };
  
  // Get the appropriate logo based on theme and settings
  const getLogoConfig = () => {
    const isDark = resolvedTheme === 'dark';
    const customLogo = isDark ? businessSettings?.logo_dark_url : businessSettings?.logo_light_url;
    const fallbackLogo = isDark ? LogoWhite : Logo;
    // In dark mode, apply muted-foreground color for better contrast
    const color = isDark ? 'hsl(40 10% 60%)' : null;
    return { url: customLogo || fallbackLogo, color };
  };
  
  // Get the appropriate icon based on theme and settings
  const getIcon = () => {
    const isDark = resolvedTheme === 'dark';
    return isDark ? businessSettings?.icon_dark_url : businessSettings?.icon_light_url;
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
                  {hasCustomIcon() ? (
                    <img 
                      src={getIcon()} 
                      alt={businessSettings?.business_name || 'Drop Dead'} 
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-display text-sm font-bold">
                      {(businessSettings?.business_name || 'DD').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">{businessSettings?.business_name || 'Drop Dead'}</TooltipContent>
              </Tooltip>
            ) : hasCustomLogo() ? (
              <ColoredLogo 
                logoUrl={getLogoConfig().url} 
                color={getLogoConfig().color}
                size={20}
                alt={businessSettings?.business_name || 'Drop Dead'}
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

      {/* Announcements Widget - at the very top (hide when collapsed) */}
      {!isCollapsed && <SidebarAnnouncementsWidget onNavClick={onNavClick} />}

      {/* Phorest Sync Status Widget moved to header popout */}

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

        {/* Dynamic Section Rendering Based on Custom Layout */}
        {sectionOrder.map((sectionId, index) => {
          // Check if this is a custom section
          const isCustom = !isBuiltInSection(sectionId);
          
          // Get the items for this section
          let sectionItems: NavItem[];
          
          if (isCustom) {
            // For custom sections, get items from linkOrder using the allNavItemsByHref map
            const customLinks = sidebarLayout?.linkOrder?.[sectionId] || [];
            sectionItems = customLinks
              .map(href => allNavItemsByHref[href])
              .filter((item): item is NavItem => !!item);
          } else {
            sectionItems = sectionItemsMap[sectionId as keyof typeof sectionItemsMap];
          }
          
          if (!sectionItems || sectionItems.length === 0) return null;
          
          // Apply custom link ordering (for built-in sections)
          const orderedItems = isCustom ? sectionItems : getOrderedItems(sectionId, sectionItems);
          
          // First, apply permission-based filtering (security layer)
          const permissionFilteredItems = filterNavItems(orderedItems);
          
          // Then apply dynamic visibility from the configurator (this is the PRIMARY control)
          // The configurator overrides permission-based visibility
          const sectionHiddenLinks = hiddenLinks[sectionId] || [];
          const hasConfiguratorOverrides = anyRoleHasOverrides(sidebarLayout, roles);
          
          // If configurator has overrides for this role, use it as the source of truth
          // Otherwise fall back to permission filtering only
          let visibleItems: typeof permissionFilteredItems;
          if (hasConfiguratorOverrides) {
            // Configurator controls visibility - filter from ordered items, not permission-filtered
            visibleItems = orderedItems.filter(item => !sectionHiddenLinks.includes(item.href));
          } else {
            // No configurator overrides - use permission filtering, then apply global hidden links
            visibleItems = permissionFilteredItems.filter(item => !sectionHiddenLinks.includes(item.href));
          }
          
          let filteredItems = visibleItems;
          let shouldShow = filteredItems.length > 0;
          
          // Get section label - use custom name for custom sections
          let sectionLabel: string;
          if (isCustom) {
            sectionLabel = sidebarLayout?.customSections?.[sectionId]?.name || sectionId;
          } else {
            sectionLabel = SECTION_LABELS[sectionId] || sectionId;
          }
          
          // Section-specific logic (only for built-in sections)
          // Note: When configurator has overrides, these are informational only
          // The configurator is the primary control for visibility
          if (sectionId === 'housekeeping') {
            // Only filter out onboarding from housekeeping if:
            // 1. Onboarding is incomplete AND
            // 2. User is not an admin (admins always see it in housekeeping) AND
            // 3. The START HERE section will be showing instead
            const isAdminViewing = roles.includes('admin') || roles.includes('super_admin');
            if (!isOnboardingComplete && !isAdminViewing) {
              // Hide from housekeeping - it shows in START HERE at the top instead
              filteredItems = filteredItems.filter(item => 
                item.href !== '/dashboard/onboarding'
              );
            }
            shouldShow = filteredItems.length > 0;
          }
          
          // For manager and adminOnly sections, only apply hardcoded checks 
          // when configurator doesn't have role-specific overrides
          if (!hasConfiguratorOverrides) {
            if (sectionId === 'manager') {
              shouldShow = effectiveIsCoach && filteredItems.length > 0;
            }
            
            if (sectionId === 'adminOnly') {
              shouldShow = (roles.includes('admin') || roles.includes('super_admin')) && filteredItems.length > 0;
            }
          }
          
          if (!shouldShow) return null;
          
          // Get badge count for specific items
          const getBadgeCount = (href: string) => {
            if (href === '/dashboard' && sectionId === 'main') return unreadCount;
            if (href === '/dashboard/admin/announcements' && sectionId === 'manager') return unreadCount;
            return undefined;
          };
          
          return (
            <div key={sectionId}>
              {/* Show divider for all sections except the first one */}
              {index > 0 && (
                <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
                  <div className="h-px bg-border" />
                </div>
              )}
              
              {/* Section header - special case for website with external link */}
              {!isCollapsed && sectionId !== 'main' && (
                <div className={cn(
                  "px-4 mb-2",
                  sectionId === 'website' && "flex items-center justify-between"
                )}>
                  <p className="text-xs uppercase tracking-wider text-foreground font-display font-medium">
                    {sectionLabel}
                  </p>
                  {sectionId === 'website' && (
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
                  )}
                </div>
              )}
              
              {/* Links */}
              <div className="space-y-1">
                {filteredItems.map((item) => (
                  <NavLink 
                    key={item.href} 
                    {...item} 
                    badgeCount={getBadgeCount(item.href)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
});

SidebarNavContent.displayName = 'SidebarNavContent';

export default SidebarNavContent;
