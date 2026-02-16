import { forwardRef, useEffect, useRef, useImperativeHandle, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRubberBandScroll } from '@/hooks/useRubberBandScroll';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ExternalLink, Rocket, TrendingUp, Users, LayoutGrid, Briefcase, ArrowLeft, Shield } from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';
import LogoWhite from '@/assets/drop-dead-logo-white.svg';
import { SidebarAnnouncementsWidget } from './SidebarAnnouncementsWidget';
import { SidebarSyncStatusWidget } from './SidebarSyncStatusWidget';
import { SidebarLockButton } from './SidebarLockButton';
import { SidebarClockButton } from './SidebarClockButton';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useSidebarLayout, SECTION_LABELS, DEFAULT_SECTION_ORDER, DEFAULT_LINK_ORDER, MANAGEMENT_SUB_GROUPS, isBuiltInSection, getEffectiveHiddenSections, getEffectiveHiddenLinks, anyRoleHasOverrides } from '@/hooks/useSidebarLayout';
import { CollapsibleNavGroup, type NavSubGroup } from './CollapsibleNavGroup';
import { AccountOwnerOrgSwitcher } from './AccountOwnerOrgSwitcher';
type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer';

interface NavItem {
  href: string;
  label: string;
  labelKey?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: string[];
  platformRoles?: PlatformRole[];
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
  housekeepingNavItems: NavItem[];
  managerNavItems: NavItem[];
  websiteNavItems: NavItem[];
  adminOnlyNavItems: NavItem[];
  platformNavItems?: NavItem[];
  footerNavItems?: NavItem[];
  isPlatformUser?: boolean;
  isMultiOrgOwner?: boolean;
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
    housekeepingNavItems,
    managerNavItems,
    websiteNavItems,
    adminOnlyNavItems,
    platformNavItems = [],
    footerNavItems = [],
    isPlatformUser = false,
    isMultiOrgOwner = false,
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
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { resolvedTheme } = useDashboardTheme();
  const internalRef = useRef<HTMLElement>(null);
  useRubberBandScroll(internalRef);
  const { data: businessSettings } = useBusinessSettings();
  const { data: sidebarLayout } = useSidebarLayout();
  
  // Map section IDs to nav items (for built-in sections)
  const sectionItemsMap = useMemo(() => ({
    main: mainNavItems,
    growth: growthNavItems,
    stats: statsNavItems,
    housekeeping: housekeepingNavItems,
    manager: managerNavItems,
    website: websiteNavItems,
    adminOnly: adminOnlyNavItems,
    platform: platformNavItems,
  }), [mainNavItems, growthNavItems, statsNavItems, housekeepingNavItems, managerNavItems, websiteNavItems, adminOnlyNavItems, platformNavItems]);

  // Create a map of all nav items by href (for custom sections that can contain any link)
  const allNavItemsByHref = useMemo(() => {
    const allItems = [
      ...mainNavItems,
      ...growthNavItems,
      ...statsNavItems,
      ...housekeepingNavItems,
      ...managerNavItems,
      ...websiteNavItems,
      ...adminOnlyNavItems,
      ...platformNavItems,
    ];
    const map: Record<string, NavItem> = {};
    allItems.forEach(item => {
      map[item.href] = item;
    });
    return map;
  }, [mainNavItems, growthNavItems, statsNavItems, housekeepingNavItems, managerNavItems, websiteNavItems, adminOnlyNavItems, platformNavItems]);

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
  const getLogo = () => {
    const isDark = resolvedTheme === 'dark';
    const customLogo = isDark ? businessSettings?.logo_dark_url : businessSettings?.logo_light_url;
    const fallbackLogo = isDark ? LogoWhite : Logo;
    return customLogo || fallbackLogo;
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

  // Dynamic label: i18n when labelKey set, role-based for stats, else fallback to label
  const getNavLabel = (item: NavItem): string => {
    if (item.href === '/dashboard/stats') {
      const isAdminUser = roles.includes('admin') || roles.includes('super_admin') || roles.includes('manager');
      return isAdminUser ? t('nav.team_stats') : t('nav.my_stats');
    }
    if (item.labelKey) return t(`nav.${item.labelKey}`);
    return item.label;
  };

  const NavLink = ({ 
    href, 
    label, 
    icon: Icon, 
    badgeCount,
    inFooter = false
  }: { 
    href: string; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badgeCount?: number;
    inFooter?: boolean;
  }) => {
    const isActive = location.pathname === href;
    const displayLabel = label;
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      // Always navigate with a fresh timestamp to trigger state reset on same-route navigation
      navigate(href, { state: { navTimestamp: Date.now() } });
      onNavClick();
    };
    
    const linkContent = (
      <a
        href={href}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 text-sm font-sans cursor-pointer",
          "transition-all duration-200 ease-out rounded-lg",
          isCollapsed 
            ? cn("px-2 py-2.5 justify-center", inFooter ? "mx-0" : "mx-2")
            : cn("px-3 py-2.5", inFooter ? "mx-0" : "mx-3"),
          isActive 
            ? "bg-foreground text-background shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:translate-x-0.5"
        )}
      >
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-foreground/60" />
        )}
        <Icon className="w-4 h-4 shrink-0" />
        {!isCollapsed && <span className="flex-1">{displayLabel}</span>}
        {!isCollapsed && badgeCount !== undefined && badgeCount > 0 && (
          <span className={cn(
            "inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-medium rounded-md border shadow-sm",
            isActive
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-red-950/60 text-red-300 border-red-500/40 shadow-[0_0_8px_rgba(220,38,38,0.15)]"
          )}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
        {isCollapsed && badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        )}
      </a>
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
            {displayLabel}
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
      <div className={cn("border-b border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]", isCollapsed ? "p-3" : "p-6")}>
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
                    <div className="w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-display text-sm">
                      {(businessSettings?.business_name || 'DD').substring(0, 2).toUpperCase()}
                    </div>
                  )}
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
      </div>

      {/* Platform Hub link removed - access via platform routes only */}

      {/* Multi-Org Owner Switcher - shows when user has access to multiple orgs */}
      {isMultiOrgOwner && (
        <div className={cn("border-b border-border", isCollapsed ? "p-2" : "px-4 py-3")}>
          <AccountOwnerOrgSwitcher isCollapsed={isCollapsed} />
        </div>
      )}

      {/* Announcements Widget - at the very top (hide when collapsed) */}
      {!isCollapsed && <SidebarAnnouncementsWidget onNavClick={onNavClick} />}

      {/* Phorest Sync Status Widget moved to header popout */}

      {/* Navigation */}
      <nav ref={internalRef} className="sidebar-nav flex-1 py-4 overflow-y-auto overscroll-none mb-3 min-h-0">
        {/* START HERE Priority Section - Only shows when onboarding incomplete (not for super_admin/owners) */}
        {!isOnboardingComplete && !roles.includes('super_admin') && (
          <div className="mb-4">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/dashboard/onboarding"
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center justify-center px-2 py-2.5 mx-2 text-sm font-sans",
                      "transition-all duration-200 ease-out rounded-lg",
                      location.pathname === '/dashboard/onboarding'
                        ? "bg-foreground text-background shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                  "flex items-center gap-3 px-3 py-2.5 mx-3 text-sm font-sans",
                  "transition-all duration-200 ease-out rounded-lg",
                  location.pathname === '/dashboard/onboarding'
                    ? "bg-foreground text-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
              <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
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
            const isSuperAdmin = roles.includes('super_admin');
            // Super admins never see onboarding (it's for staff, not owners)
            // Admins always see it in housekeeping
            // Other roles see it here only when complete (otherwise it's in START HERE)
            if (isSuperAdmin || (!isOnboardingComplete && !roles.includes('admin'))) {
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
          
          // Platform section should NEVER show in org dashboard - 
          // it has its own dedicated layout at /dashboard/platform/*
          if (sectionId === 'platform') {
            shouldShow = false;
          }
          
          if (!shouldShow) return null;
          
          // Get badge count for specific items
          const getBadgeCount = (href: string) => {
            if (href === '/dashboard' && sectionId === 'main') return unreadCount;
            if (href === '/dashboard/admin/announcements' && sectionId === 'manager') return unreadCount;
            return undefined;
          };
          
          // Build management sub-groups for collapsible rendering
          const buildManagementSubGroups = (): NavSubGroup[] => {
            const groups: NavSubGroup[] = [];
            
            // Team Tools group (shown first for better visibility to staff)
            const teamToolsItems = filteredItems.filter(item => 
              MANAGEMENT_SUB_GROUPS.teamTools.links.includes(item.href)
            );
            if (teamToolsItems.length > 0) {
              groups.push({
                id: 'teamTools',
                label: MANAGEMENT_SUB_GROUPS.teamTools.label,
                icon: Briefcase,
                items: teamToolsItems,
              });
            }
            
            // Analytics & Insights group
            const analyticsItems = filteredItems.filter(item => 
              MANAGEMENT_SUB_GROUPS.analytics.links.includes(item.href)
            );
            if (analyticsItems.length > 0) {
              groups.push({
                id: 'analytics',
                label: MANAGEMENT_SUB_GROUPS.analytics.label,
                icon: TrendingUp,
                items: analyticsItems,
              });
            }
            
            // People group
            const peopleItems = filteredItems.filter(item => 
              MANAGEMENT_SUB_GROUPS.people.links.includes(item.href)
            );
            if (peopleItems.length > 0) {
              groups.push({
                id: 'people',
                label: MANAGEMENT_SUB_GROUPS.people.label,
                icon: Users,
                items: peopleItems,
              });
            }
            
            // Operations group
            const operationsItems = filteredItems.filter(item => 
              MANAGEMENT_SUB_GROUPS.operations.links.includes(item.href)
            );
            if (operationsItems.length > 0) {
              groups.push({
                id: 'operations',
                label: MANAGEMENT_SUB_GROUPS.operations.label,
                icon: LayoutGrid,
                items: operationsItems,
              });
            }
            
            return groups;
          };
          
          return (
            <div key={sectionId}>
              {/* Show divider for all sections except the first one */}
              {index > 0 && (
                <div className={cn("my-4", isCollapsed ? "px-2" : "px-4")}>
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
              )}
              
              {/* Section header */}
              {!isCollapsed && sectionId !== 'main' && (
                <div className="px-4 mb-2">
                  <p className="text-xs uppercase tracking-wider text-foreground font-display font-medium">
                    {sectionLabel}
                  </p>
                </div>
              )}
              
              {/* Links - use CollapsibleNavGroup for manager section */}
              {sectionId === 'manager' ? (
                <CollapsibleNavGroup
                  groups={buildManagementSubGroups()}
                  sectionLabel={sectionLabel}
                  isCollapsed={isCollapsed}
                  onNavClick={onNavClick}
                  getNavLabel={getNavLabel}
                  hiddenLinks={sectionHiddenLinks}
                />
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <NavLink 
                      key={item.href} 
                      href={item.href}
                      label={getNavLabel(item)}
                      icon={item.icon}
                      badgeCount={getBadgeCount(item.href)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Fixed Footer Navigation - always at bottom */}
      <div className="mt-auto shrink-0">
        <div className={cn(
          "mx-3 rounded-lg bg-muted/30 border border-border/50",
          isCollapsed ? "mx-2 p-1" : "p-1.5"
        )}>
          <div className={cn(
            isCollapsed ? "space-y-1" : "space-y-0.5"
          )}>
            {/* Clock In/Out Button */}
            <SidebarClockButton isCollapsed={isCollapsed} />
            {/* Lock Button */}
            <SidebarLockButton isCollapsed={isCollapsed} />
          </div>
        </div>
        <div className="h-2" /> {/* Bottom spacing */}
      </div>
    </div>
  );
});

SidebarNavContent.displayName = 'SidebarNavContent';

export default SidebarNavContent;
