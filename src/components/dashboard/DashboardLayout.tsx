import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadAnnouncements } from '@/hooks/useUnreadAnnouncements';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { ROLE_LABELS } from '@/hooks/useUserRoles';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
import {
  LayoutDashboard,
  Target,
  Trophy,
  Video,
  BarChart3,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  X,
  HelpCircle,
  CalendarClock,
  UserCircle,
  Contact,
  Globe,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  Scissors,
  Headset,
  HandHelping,
  User,
} from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';

const ALL_ROLES: AppRole[] = ['admin', 'manager', 'stylist', 'receptionist', 'assistant'];

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  stylist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  receptionist: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  assistant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[]; // If undefined, visible to all authenticated users
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/dashboard/directory', label: 'Team Directory', icon: Contact },
];

const housekeepingNavItems: NavItem[] = [
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: Users },
  { href: '/dashboard/handbooks', label: 'Handbooks', icon: FileText },
];

const growthNavItems: NavItem[] = [
  { href: '/dashboard/training', label: 'Training', icon: Video },
  { href: '/dashboard/program', label: 'Client Engine', icon: Target, roles: ['stylist', 'manager', 'admin'] },
  { href: '/dashboard/ring-the-bell', label: 'Ring the Bell', icon: Bell, roles: ['stylist', 'manager', 'admin'] },
];

const getHelpNavItems: NavItem[] = [
  { href: '/dashboard/assistant-schedule', label: 'Assistant Schedule', icon: Users, roles: ['stylist', 'assistant', 'manager', 'admin'] },
  { href: '/dashboard/schedule-meeting', label: 'Schedule 1:1 Meeting', icon: CalendarClock },
];

const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, roles: ['stylist', 'manager', 'admin'] },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

// Manager-accessible admin items
const managerNavItems: NavItem[] = [
  { href: '/dashboard/admin/team', label: 'Team Overview', icon: Users },
  { href: '/dashboard/admin/announcements', label: 'Announcements', icon: Bell },
];

// Full admin-only items (not visible to managers)
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/approvals', label: 'Account Approvals', icon: UserCheck },
  { href: '/dashboard/admin/roles', label: 'Manage Roles', icon: Shield },
  { href: '/dashboard/admin/handbooks', label: 'Handbooks', icon: FileText },
  { href: '/dashboard/admin/homepage-stylists', label: 'Homepage Stylists', icon: Globe },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isCoach, roles: actualRoles, signOut } = useAuth();
  const { viewAsRole, setViewAsRole, isViewingAs } = useViewAs();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadAnnouncements();
  const { percentage: profileCompletion } = useProfileCompletion();

  // Use simulated role if viewing as, otherwise use actual roles
  const roles = isViewingAs && viewAsRole ? [viewAsRole] : actualRoles;
  const isAdmin = actualRoles.includes('admin');
  // isCoach should use simulated roles for nav visibility
  const effectiveIsCoach = isViewingAs ? (viewAsRole === 'admin' || viewAsRole === 'manager') : isCoach;

  // Get the user's primary access level for display
  const getAccessLabel = () => {
    if (actualRoles.includes('admin')) return 'Full Access Admin';
    if (actualRoles.includes('manager')) return 'Manager';
    if (actualRoles.includes('stylist')) return 'Stylist';
    if (actualRoles.includes('receptionist')) return 'Receptionist';
    if (actualRoles.includes('assistant')) return 'Assistant';
    return 'Team Member';
  };

  const getAccessIcon = () => {
    if (actualRoles.includes('admin')) return Crown;
    if (actualRoles.includes('manager')) return Shield;
    if (actualRoles.includes('stylist')) return Scissors;
    if (actualRoles.includes('receptionist')) return Headset;
    if (actualRoles.includes('assistant')) return HandHelping;
    return User;
  };

  const getAccessBadgeColor = () => {
    if (actualRoles.includes('admin')) return 'bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 text-amber-900 border-amber-400 dark:from-amber-800/50 dark:via-orange-700/30 dark:to-amber-800/50 dark:text-amber-200 dark:border-amber-600 bg-[length:200%_100%] animate-shine';
    if (actualRoles.includes('manager')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    if (actualRoles.includes('stylist')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (actualRoles.includes('receptionist')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    if (actualRoles.includes('assistant')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return 'bg-muted text-muted-foreground border-border';
  };

  const AccessIcon = getAccessIcon();

  const handleSignOut = async () => {
    setViewAsRole(null); // Clear view as on sign out
    await signOut();
    navigate('/staff-login');
  };

  // Filter nav items based on user roles (uses effective roles)
  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true; // No roles specified = visible to all
      return item.roles.some(role => roles.includes(role));
    });
  };

  const NavLink = ({ href, label, icon: Icon, badgeCount }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badgeCount?: number }) => {
    const isActive = location.pathname === href;
    return (
      <Link
        to={href}
        onClick={() => setSidebarOpen(false)}
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

  const SidebarContent = () => (
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
      <nav className="flex-1 py-4 overflow-y-auto">
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

        {/* Manager Section - visible to managers and admins */}
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

        {/* Admin Only Section - visible only to admins */}
        {roles.includes('admin') && filterNavItems(adminOnlyNavItems).length > 0 && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-foreground font-display font-medium">
              Full Access Admin
            </p>
            <div className="space-y-1">
              {filterNavItems(adminOnlyNavItems).map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <Link 
          to="/dashboard/profile" 
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 mb-4 p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="relative">
            <div className="w-10 h-10 bg-muted flex items-center justify-center text-sm font-display rounded-full">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            {profileCompletion < 100 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute -top-1 -right-1">
                    <svg className="w-5 h-5 -rotate-90">
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="6"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="2"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="6"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${(profileCompletion / 100) * 37.7} 37.7`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                      {profileCompletion}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Profile {profileCompletion}% complete</p>
                </TooltipContent>
              </Tooltip>
            )}
            {profileCompletion === 100 && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-sans truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {isCoach ? 'Coach' : 'Stylist'}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );


  // View As Component for admins - allows viewing dashboard as different roles
  const ViewAsToggle = () => {
    if (!isAdmin) return null;

    const roleIcons: Record<AppRole, React.ComponentType<{ className?: string }>> = {
      admin: Crown,
      manager: Shield,
      stylist: Scissors,
      receptionist: Headset,
      assistant: HandHelping,
    };

    const roleDescriptions: Record<AppRole, string> = {
      admin: 'Full system access',
      manager: 'Team management access',
      stylist: 'Stylist dashboard view',
      receptionist: 'Front desk access',
      assistant: 'Assistant tools access',
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={isViewingAs ? "default" : "outline"} 
            size="sm" 
            className={cn(
              "gap-2",
              isViewingAs && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
            )}
          >
            {isViewingAs ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isViewingAs ? `Viewing as ${ROLE_LABELS[viewAsRole!]}` : 'View As'}
            </span>
            {isViewingAs && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs px-1.5 py-0 ml-1", roleColors[viewAsRole!])}
              >
                {ROLE_LABELS[viewAsRole!]?.charAt(0)}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-2 bg-card border border-border shadow-lg">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="p-2 bg-muted">
              <Eye className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-medium">View Dashboard As</p>
              <p className="text-xs text-muted-foreground">Preview how other roles see the app</p>
            </div>
          </div>
          <DropdownMenuSeparator className="my-2" />
          {isViewingAs && (
            <>
              <DropdownMenuItem
                onClick={() => setViewAsRole(null)}
                className="flex items-center gap-3 px-3 py-3 cursor-pointer bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 mb-2"
              >
                <div className="p-1.5 bg-amber-500 text-white">
                  <X className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Exit Preview Mode</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Return to your admin view</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
            </>
          )}
          <div className="space-y-1">
            {ALL_ROLES.filter(role => role !== 'admin').map(role => {
              const RoleIcon = roleIcons[role];
              const isSelected = viewAsRole === role;
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setViewAsRole(role)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 cursor-pointer transition-all group",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className={cn(
                    "p-1.5 transition-all border border-transparent group-hover:border-foreground/30",
                    roleColors[role]
                  )}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                    <p className="text-xs text-muted-foreground truncate">{roleDescriptions[role]}</p>
                  </div>
                  {isSelected && (
                    <div className="p-1 bg-amber-500 text-white">
                      <Eye className="w-3 h-3" />
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:border-border lg:bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b border-border bg-background">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <Link to="/dashboard">
          <img src={Logo} alt="Drop Dead" className="h-4 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-medium gap-1.5", getAccessBadgeColor())}>
            <AccessIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{getAccessLabel()}</span>
          </Badge>
          <ViewAsToggle />
          <NotificationsPanel unreadCount={unreadCount} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <UserCircle className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="w-4 h-4" />
                  View/Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* View As Banner */}
      <AnimatePresence>
        {isViewingAs && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-amber-500 text-white text-center text-sm font-medium lg:pl-64 overflow-hidden"
          >
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex items-center justify-center gap-2 py-2 px-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Eye className="w-4 h-4" />
              </motion.div>
              <span>Viewing as <strong>{ROLE_LABELS[viewAsRole!]}</strong> – This is a preview only</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewAsRole(null)}
                className="h-6 px-2 text-white hover:bg-amber-600 hover:text-white ml-2"
              >
                <X className="w-3 h-3 mr-1" />
                Exit
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Top Bar */}
      <div className="hidden lg:block lg:pl-64">
        <div className="sticky top-0 z-30 flex items-center justify-end gap-3 h-12 px-6 border-b border-border bg-card/80 backdrop-blur-sm">
          <Badge variant="outline" className={cn("text-xs font-medium gap-1.5", getAccessBadgeColor())}>
            <AccessIcon className="w-3 h-3" />
            {getAccessLabel()}
          </Badge>
          {isAdmin && <ViewAsToggle />}
          <NotificationsPanel unreadCount={unreadCount} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <UserCircle className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="w-4 h-4" />
                  View/Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className={cn("min-h-screen", isAdmin && "lg:pt-0")}>
          {children}
        </div>
      </main>
    </div>
  );
}
