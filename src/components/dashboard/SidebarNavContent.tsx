import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: string[];
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
  }, ref) => {
  const location = useLocation();
  const internalRef = useRef<HTMLElement>(null);
  
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
    return (
      <Link
        to={href}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm font-sans transition-colors",
          isActive 
            ? "bg-foreground text-background" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="flex-1">{label}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
            {badgeCount > 9 ? '9+' : badgeCount}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/dashboard" className="block">
          <img src={Logo} alt="Drop Dead" className="h-5 w-auto" />
        </Link>
        <p className="text-xs text-muted-foreground mt-2 font-sans">
          Staff Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav ref={internalRef} className="flex-1 py-4 overflow-y-auto">
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
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Growth
            </p>
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
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Stats & Leaderboard
            </p>
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
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Get Help
            </p>
            <div className="space-y-1">
              {filterNavItems(getHelpNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Housekeeping Section */}
        {filterNavItems(housekeepingNavItems).length > 0 && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Housekeeping
            </p>
            <div className="space-y-1">
              {filterNavItems(housekeepingNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Manager Section */}
        {effectiveIsCoach && filterNavItems(managerNavItems).length > 0 && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Management
            </p>
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
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
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
            <div className="space-y-1">
              {filterNavItems(websiteNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Admin Only Section */}
        {roles.includes('admin') && filterNavItems(adminOnlyNavItems).length > 0 && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Super Admin
            </p>
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
