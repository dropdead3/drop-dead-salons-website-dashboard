import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useHideNumbers } from '@/contexts/HideNumbersContext';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { PhorestSyncPopout } from '@/components/dashboard/PhorestSyncPopout';
import { ImpersonationHistoryPanel } from '@/components/dashboard/ImpersonationHistoryPanel';
import SidebarNavContent from '@/components/dashboard/SidebarNavContent';
import { OrganizationSwitcher } from '@/components/platform/OrganizationSwitcher';
import { PlatformContextBanner } from '@/components/platform/PlatformContextBanner';
import { useRoleUtils, getIconComponent } from '@/hooks/useRoleUtils';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import { isTestAccount } from '@/utils/testAccounts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  Scissors,
  Headset,
  HandHelping,
  User,
  ExternalLink,
  Quote,
  Images,
  Layers,
  MapPin,
  ClipboardList,
  Cake,
  History,
  AlertTriangle,
  CreditCard,
  Camera,
  Briefcase,
  GraduationCap,
  Pause,
  FlaskConical,
  Link2,
  DollarSign,
  CalendarDays,
  PanelLeftClose,
  ChevronRight,
  Flag,
  Sparkles,
  BookOpen,
  TrendingUp,
  LayoutGrid,
  Terminal,
  Building2,
  Upload,
} from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';
import LogoWhite from '@/assets/drop-dead-logo-white.svg';
// Dark mode is now scoped via DashboardThemeContext
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { NextClientIndicator } from '@/components/dashboard/NextClientIndicator';

// Role colors/icons now come from useRoleUtils hook

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string; // Permission required to view this item
  roles?: AppRole[]; // Fallback: If undefined, visible to all authenticated users
  platformRoles?: PlatformRole[]; // Restrict to specific platform roles (uses hierarchy)
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'view_command_center' },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, permission: 'view_booking_calendar' },
  { href: '/dashboard/directory', label: 'Team Directory', icon: Contact, permission: 'view_team_directory' },
];

const housekeepingNavItems: NavItem[] = [
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: Users, permission: 'view_onboarding' },
  { href: '/dashboard/handbooks', label: 'Handbooks', icon: FileText, permission: 'view_handbooks' },
  { href: '/dashboard/changelog', label: "What's New", icon: Sparkles },
  { href: '/dashboard/help', label: 'Help Center', icon: HelpCircle },
];

const growthNavItems: NavItem[] = [
  { href: '/dashboard/training', label: 'Training', icon: Video, permission: 'view_training' },
  { href: '/dashboard/program', label: 'New-Client Engine Program', icon: Target, permission: 'access_client_engine' },
  { href: '/dashboard/admin/team', label: 'Program Team Overview', icon: Users, permission: 'view_team_overview' },
  { href: '/dashboard/ring-the-bell', label: 'Ring the Bell', icon: Bell, permission: 'ring_the_bell' },
  { href: '/dashboard/my-graduation', label: 'My Graduation', icon: GraduationCap, permission: 'view_my_graduation' },
];

// Base get help items - the assistant schedule label is computed dynamically in the component
// Note: Assistant schedule is excluded for admins (they see it in manager section instead)
const baseGetHelpNavItems: NavItem[] = [
  { href: '/dashboard/assistant-schedule', label: 'Assistant Schedule', icon: Users, permission: 'view_assistant_schedule' },
  { href: '/dashboard/schedule-meeting', label: 'Schedule 1:1 Meeting', icon: CalendarClock, permission: 'schedule_meetings' },
];

const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, permission: 'view_own_stats' },
  { href: '/dashboard/my-clients', label: 'My Clients', icon: Users, permission: 'view_own_stats', roles: ['stylist', 'stylist_assistant'] },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
];

// Manager-accessible admin items
const managerNavItems: NavItem[] = [
  { href: '/dashboard/admin/leads', label: 'Lead Management', icon: UserPlus, permission: 'view_team_overview' },
  { href: '/dashboard/admin/birthdays', label: 'Birthdays & Anniversaries', icon: Cake, permission: 'view_team_overview' },
  { href: '/dashboard/admin/onboarding-tracker', label: 'Onboarding Hub', icon: ClipboardList, permission: 'view_team_overview' },
  { href: '/dashboard/admin/client-engine-tracker', label: 'Client Engine Tracker', icon: Target, permission: 'view_team_overview' },
  { href: '/dashboard/admin/recruiting', label: 'Recruiting Pipeline', icon: Briefcase, permission: 'view_team_overview' },
  { href: '/dashboard/admin/graduation-tracker', label: 'Graduation Tracker', icon: GraduationCap, permission: 'view_team_overview' },
  { href: '/dashboard/admin/assistant-requests', label: 'Assistant Requests', icon: HandHelping, permission: 'view_team_overview' },
  { href: '/dashboard/admin/schedule-requests', label: 'Schedule Requests', icon: CalendarClock, permission: 'manage_schedule_requests' },
  { href: '/dashboard/admin/strikes', label: 'Staff Strikes', icon: AlertTriangle, permission: 'manage_user_roles' },
  { href: '/dashboard/admin/business-cards', label: 'Business Cards', icon: CreditCard, permission: 'manage_settings' },
  { href: '/dashboard/admin/headshots', label: 'Headshots', icon: Camera, permission: 'manage_settings' },
  { href: '/dashboard/admin/announcements', label: 'Create Announcement', icon: Bell, permission: 'manage_announcements' },
  { href: '/dashboard/admin/changelog', label: 'Changelog Manager', icon: Sparkles, permission: 'manage_announcements' },
];

// Full admin-only items (not visible to managers)
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Invitations & Approvals', icon: UserPlus, permission: 'approve_accounts' },
  { href: '/dashboard/admin/roles', label: 'Manage Users & Roles', icon: Shield, permission: 'manage_user_roles' },
  { href: '/dashboard/admin/feature-flags', label: 'Feature Flags', icon: Flag, permission: 'manage_settings' },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings, permission: 'manage_settings' },
];

// Website management items - consolidated into single entry
const websiteNavItems: NavItem[] = [
  { href: '/dashboard/admin/website-sections', label: 'Website Editor', icon: LayoutGrid, permission: 'manage_homepage_stylists' },
];

// Platform admin nav items - only for platform team members
const platformNavItems: NavItem[] = [
  { href: '/dashboard/platform/overview', label: 'Platform Overview', icon: Terminal },
  { href: '/dashboard/platform/accounts', label: 'Accounts', icon: Building2 },
  { href: '/dashboard/platform/import', label: 'Migrations', icon: Upload },
  { href: '/dashboard/platform/revenue', label: 'Revenue', icon: DollarSign, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/permissions', label: 'Permissions', icon: Shield, platformRoles: ['platform_owner', 'platform_admin'] },
  { href: '/dashboard/platform/settings', label: 'Platform Settings', icon: Settings, platformRoles: ['platform_owner', 'platform_admin'] },
];

const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed';

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });
  const [userSearch, setUserSearch] = useState('');
  
  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
  const toggleSidebarCollapsed = () => setSidebarCollapsed(prev => !prev);
  const { user, isCoach, roles: actualRoles, permissions: actualPermissions, hasPermission: actualHasPermission, signOut, isPlatformUser, hasPlatformRoleOrHigher } = useAuth();
  const { isImpersonating } = useOrganizationContext();
  const { viewAsRole, setViewAsRole, isViewingAs, viewAsUser, setViewAsUser, isViewingAsUser, clearViewAs } = useViewAs();
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useDashboardTheme();
  const { data: businessSettings } = useBusinessSettings();
  const { data: unreadCount = 0 } = useUnreadAnnouncements();
  const { percentage: profileCompletion } = useProfileCompletion();
  const { isComplete: isOnboardingComplete, percentage: onboardingPercentage, tasksCompleted, tasksTotal, handbooksCompleted, handbooksTotal, hasBusinessCard, hasHeadshot } = useOnboardingProgress();
  
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
  // Calculate total items for progress display
  const onboardingTotalItems = tasksTotal + handbooksTotal + 2; // +2 for business card and headshot
  const onboardingCompletedItems = tasksCompleted + handbooksCompleted + (hasBusinessCard ? 1 : 0) + (hasHeadshot ? 1 : 0);
  const onboardingProgress = {
    completedCount: onboardingCompletedItems,
    totalCount: onboardingTotalItems,
    percentage: onboardingPercentage,
  };
  const { roleNames: ALL_ROLES, roleLabels: ROLE_LABELS, getRoleBadgeClasses, getRoleIcon, getRoleDescription } = useRoleUtils();

  // Close mobile sidebar on navigation
  const handleNavClick = () => {
    setSidebarOpen(false);
  };
  
  // Fetch team members for user impersonation picker - include test accounts for admin View As feature
  const { data: teamMembers = [] } = useTeamDirectory(undefined, { includeTestAccounts: true });

  // Use simulated role if viewing as a role, or the impersonated user's roles
  const roles = isViewingAsUser && viewAsUser 
    ? viewAsUser.roles 
    : (isViewingAs && viewAsRole ? [viewAsRole] : actualRoles);
  const isAdmin = actualRoles.includes('admin') || actualRoles.includes('super_admin');
  // isCoach should use simulated roles for nav visibility
  const effectiveIsCoach = isViewingAs 
    ? (viewAsRole === 'admin' || viewAsRole === 'manager' || viewAsRole === 'super_admin' || viewAsUser?.roles.some(r => r === 'admin' || r === 'manager' || r === 'super_admin')) 
    : isCoach;

  // Permission checking that respects View As mode
  // When viewing as a role, we need to simulate that role's permissions
  const getSimulatedPermissions = (role: AppRole): string[] => {
    // These are the default permissions for each role - should match database seed
    const rolePermissionMap: Record<AppRole, string[]> = {
      super_admin: [
        'view_command_center', 'view_team_directory', 'view_training', 'access_client_engine',
        'ring_the_bell', 'view_leaderboard', 'view_own_stats', 'view_assistant_schedule',
        'request_assistant', 'manage_assistant_schedule', 'schedule_meetings', 'view_onboarding',
        'view_handbooks', 'view_team_overview', 'manage_announcements', 'view_all_stats',
        'approve_accounts', 'manage_user_roles', 'manage_handbooks', 'manage_homepage_stylists',
        'manage_settings', 'grant_super_admin', 'view_booking_calendar', 'view_all_locations_calendar',
        'view_team_appointments', 'create_appointments', 'add_appointment_notes'
      ],
      admin: [
        'view_command_center', 'view_team_directory', 'view_training', 'access_client_engine',
        'ring_the_bell', 'view_leaderboard', 'view_own_stats', 'view_assistant_schedule',
        'request_assistant', 'manage_assistant_schedule', 'schedule_meetings', 'view_onboarding',
        'view_handbooks', 'view_team_overview', 'manage_announcements', 'view_all_stats',
        'approve_accounts', 'manage_user_roles', 'manage_handbooks', 'manage_homepage_stylists',
        'manage_settings', 'grant_super_admin', 'view_booking_calendar', 'view_all_locations_calendar',
        'view_team_appointments', 'create_appointments', 'add_appointment_notes'
      ],
      manager: [
        'view_command_center', 'view_team_directory', 'view_training', 'access_client_engine',
        'ring_the_bell', 'view_leaderboard', 'view_own_stats', 'view_assistant_schedule',
        'request_assistant', 'schedule_meetings', 'view_onboarding', 'view_handbooks',
        'view_team_overview', 'manage_announcements', 'view_all_stats', 'view_booking_calendar',
        'view_all_locations_calendar', 'view_team_appointments', 'create_appointments', 'add_appointment_notes'
      ],
      stylist: [
        'view_command_center', 'view_team_directory', 'view_training', 'access_client_engine',
        'ring_the_bell', 'view_leaderboard', 'view_own_stats', 'view_assistant_schedule',
        'request_assistant', 'schedule_meetings', 'view_onboarding', 'view_handbooks',
        'view_booking_calendar', 'view_own_appointments'
      ],
      receptionist: [
        'view_command_center', 'view_team_directory', 'view_training', 'view_leaderboard',
        'schedule_meetings', 'view_onboarding', 'view_handbooks', 'view_booking_calendar',
        'view_all_locations_calendar', 'view_team_appointments', 'create_appointments', 'add_appointment_notes'
      ],
      assistant: [ // Legacy
        'view_command_center', 'view_team_directory', 'view_training', 'view_leaderboard',
        'view_assistant_schedule', 'manage_assistant_schedule', 'schedule_meetings',
        'view_onboarding', 'view_handbooks', 'view_booking_calendar', 'view_own_appointments'
      ],
      stylist_assistant: [
        'view_command_center', 'view_team_directory', 'view_training', 'view_leaderboard',
        'view_assistant_schedule', 'manage_assistant_schedule', 'schedule_meetings',
        'view_onboarding', 'view_handbooks', 'view_booking_calendar', 'view_own_appointments'
      ],
      admin_assistant: [
        'view_command_center', 'view_team_directory', 'view_training', 'view_leaderboard',
        'schedule_meetings', 'view_onboarding', 'view_handbooks', 'view_team_overview',
        'view_booking_calendar', 'view_team_appointments'
      ],
      operations_assistant: [
        'view_command_center', 'view_team_directory', 'view_training', 'view_leaderboard',
        'view_assistant_schedule', 'manage_assistant_schedule', 'schedule_meetings',
        'view_onboarding', 'view_handbooks', 'view_booking_calendar', 'view_own_appointments'
      ],
    };
    return rolePermissionMap[role] || [];
  };

  // Get effective permissions based on actual permissions or simulated role
  const effectivePermissions = isViewingAs && viewAsRole 
    ? getSimulatedPermissions(viewAsRole)
    : actualPermissions;

  const hasPermission = (permissionName: string): boolean => {
    return effectivePermissions.includes(permissionName);
  };

  // Compute dynamic nav items based on effective role
  const isStylistRole = roles.includes('stylist');
  const isStylistAssistantRole = roles.includes('stylist_assistant') || roles.includes('assistant');
  const isAdminOrManager = roles.includes('admin') || roles.includes('manager') || roles.includes('super_admin');
  
  // Filter and transform Get Help nav items - exclude assistant schedule for admins/managers
  const getHelpNavItems: NavItem[] = baseGetHelpNavItems
    .filter(item => {
      // Admins/managers see assistant requests in their admin section instead
      if (item.href === '/dashboard/assistant-schedule' && isAdminOrManager) {
        return false;
      }
      return true;
    })
    .map(item => {
      if (item.href === '/dashboard/assistant-schedule') {
        const label = isStylistRole 
          ? 'Request An Assistant' 
          : isStylistAssistantRole 
            ? 'Assisting Requests' 
            : 'Assistant Schedule';
        return { ...item, label };
      }
      return item;
    });

  // Get the user's primary access level for display
  const getAccessLabel = () => {
    if (actualRoles.includes('super_admin')) return 'Super Admin';
    if (actualRoles.includes('admin')) return 'General Manager';
    if (actualRoles.includes('manager')) return 'Manager';
    if (actualRoles.includes('stylist')) return 'Stylist';
    if (actualRoles.includes('receptionist')) return 'Receptionist';
    if (actualRoles.includes('assistant')) return 'Assistant';
    return 'Team Member';
  };

  const getAccessIcon = () => {
    if (actualRoles.includes('super_admin')) return Crown;
    if (actualRoles.includes('admin')) return Crown;
    if (actualRoles.includes('manager')) return Shield;
    if (actualRoles.includes('stylist')) return Scissors;
    if (actualRoles.includes('receptionist')) return Headset;
    if (actualRoles.includes('assistant')) return HandHelping;
    return User;
  };

  const getAccessBadgeColor = () => {
    if (actualRoles.includes('super_admin')) return 'bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-200 text-yellow-900 border-yellow-400 dark:from-yellow-800/50 dark:via-amber-700/30 dark:to-yellow-800/50 dark:text-yellow-200 dark:border-yellow-600 bg-[length:200%_100%] animate-shine';
    if (actualRoles.includes('admin')) return 'bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 text-amber-900 border-amber-400 dark:from-amber-800/50 dark:via-orange-700/30 dark:to-amber-800/50 dark:text-amber-200 dark:border-amber-600 bg-[length:200%_100%] animate-shine';
    if (actualRoles.includes('manager')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    if (actualRoles.includes('stylist')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (actualRoles.includes('receptionist')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    if (actualRoles.includes('assistant')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return 'bg-muted text-muted-foreground border-border';
  };

  const AccessIcon = getAccessIcon();

  const handleSignOut = async () => {
    clearViewAs(); // Clear all view as modes on sign out
    await signOut();
    navigate('/staff-login');
  };

  // Filter nav items based on permissions (primary) or roles (fallback)
  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      // Check platform role restriction first (uses hierarchy)
      if (item.platformRoles && item.platformRoles.length > 0) {
        const hasRequiredPlatformRole = item.platformRoles.some(
          role => hasPlatformRoleOrHigher(role)
        );
        if (!hasRequiredPlatformRole) return false;
      }
      
      // Check permission
      if (item.permission) {
        return hasPermission(item.permission);
      }
      // Fallback to role-based check
      if (!item.roles) return true; // No roles or permission specified = visible to all
      return item.roles.some(role => roles.includes(role));
    });
  };



  // View As Component for admins - allows viewing dashboard as different roles or specific users
  const ViewAsToggle = () => {
    if (!isAdmin) return null;

    // roleIcons and roleDescriptions now come from useRoleUtils

    // Separate test accounts from real users using the utility
    const testAccounts = teamMembers
      .filter(member => member.user_id !== user?.id && isTestAccount(member))
      .filter(member => 
        !userSearch || 
        member.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        member.email?.toLowerCase().includes(userSearch.toLowerCase())
      );

    const realUsers = teamMembers
      .filter(member => member.user_id !== user?.id && !isTestAccount(member))
      .filter(member => 
        !userSearch || 
        member.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        member.email?.toLowerCase().includes(userSearch.toLowerCase())
      )
      .slice(0, 10);

    // Get display text for button
    const getButtonText = () => {
      if (isViewingAsUser && viewAsUser) {
        return `Viewing as ${viewAsUser.full_name.split(' ')[0]}`;
      }
      if (viewAsRole) {
        return `Viewing as ${ROLE_LABELS[viewAsRole]}`;
      }
      return 'View As';
    };

    return (
      <DropdownMenu onOpenChange={(open) => { if (!open) setUserSearch(''); }}>
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
            <span className="hidden sm:inline">{getButtonText()}</span>
            {isViewingAsUser && viewAsUser && (
              <Avatar className="h-5 w-5 border border-white/50">
                <AvatarImage src={viewAsUser.photo_url || undefined} />
                <AvatarFallback className="text-[10px] bg-white/20 text-white">
                  {viewAsUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
            {viewAsRole && !isViewingAsUser && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs px-1.5 py-0 ml-1", getRoleBadgeClasses(viewAsRole))}
              >
                {ROLE_LABELS[viewAsRole]?.charAt(0)}
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0 bg-card border border-border shadow-lg max-h-[70vh] overflow-hidden flex flex-col">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-card p-2 border-b border-border">
              <div className="flex items-center gap-3 px-2 py-3">
                <div className="p-2 bg-muted">
                  <Eye className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-display text-sm font-medium">View Dashboard As</p>
                  <p className="text-xs text-muted-foreground">Preview how roles or team members see the app</p>
                </div>
              </div>
              
              {/* Exit button when viewing */}
              {isViewingAs && (
                <DropdownMenuItem
                  onClick={() => clearViewAs()}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 mt-2"
                >
                  <div className="p-1.5 bg-amber-500 text-white">
                    <X className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Exit Preview Mode</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">Return to your admin view</p>
                  </div>
                </DropdownMenuItem>
              )}
            </div>
            
            {/* Tabbed content */}
            <Tabs defaultValue="roles" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="roles" 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 text-xs"
                >
                  Roles
                </TabsTrigger>
                <TabsTrigger 
                  value="test" 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 text-xs gap-1"
                >
                  <FlaskConical className="w-3 h-3" />
                  Test ({testAccounts.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 text-xs"
                >
                  Team
                </TabsTrigger>
              </TabsList>

              {/* Roles Tab */}
              <TabsContent value="roles" className="flex-1 overflow-y-auto m-0 p-2">
                <div className="space-y-1">
                  {ALL_ROLES.map(role => {
                    const RoleIcon = getRoleIcon(role);
                    const isSelected = viewAsRole === role && !isViewingAsUser;
                    return (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => setViewAsRole(role as AppRole)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all group",
                          isSelected && "bg-accent"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 transition-all border border-transparent group-hover:border-foreground/30",
                          getRoleBadgeClasses(role)
                        )}>
                          <RoleIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
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
              </TabsContent>

              {/* Test Accounts Tab */}
              <TabsContent value="test" className="flex-1 overflow-y-auto m-0 p-2">
                <div className="space-y-1">
                  {testAccounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No test accounts found
                    </p>
                  ) : (
                    testAccounts.map(member => {
                      const isSelected = viewAsUser?.id === member.user_id;
                      const memberRoles = member.roles as AppRole[];
                      const primaryRole = memberRoles[0];
                      
                      return (
                        <DropdownMenuItem
                          key={member.user_id}
                          onClick={() => setViewAsUser({
                            id: member.user_id,
                            full_name: member.full_name,
                            photo_url: member.photo_url,
                            roles: memberRoles,
                          })}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all",
                            isSelected && "bg-accent"
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.photo_url || undefined} />
                            <AvatarFallback className="text-xs bg-amber-100 text-amber-800">
                              {member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {primaryRole ? ROLE_LABELS[primaryRole] : 'No role'}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="p-1 bg-amber-500 text-white">
                              <Eye className="w-3 h-3" />
                            </div>
                          )}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Team Members Tab */}
              <TabsContent value="team" className="flex-1 overflow-y-auto m-0 p-0">
                {/* Search input */}
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search team members..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="p-2 space-y-1">
                  {realUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {userSearch ? 'No team members found' : 'No team members available'}
                    </p>
                  ) : (
                    realUsers.map(member => {
                      const isSelected = viewAsUser?.id === member.user_id;
                      const memberRoles = member.roles as AppRole[];
                      const primaryRole = memberRoles[0];
                      
                      return (
                        <DropdownMenuItem
                          key={member.user_id}
                          onClick={() => setViewAsUser({
                            id: member.user_id,
                            full_name: member.full_name,
                            photo_url: member.photo_url,
                            roles: memberRoles,
                          })}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all",
                            isSelected && "bg-accent"
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.photo_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {primaryRole ? ROLE_LABELS[primaryRole] : 'No role'}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="p-1 bg-amber-500 text-white">
                              <Eye className="w-3 h-3" />
                            </div>
                          )}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer with History */}
            <div className="border-t p-2">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  >
                    <div className="p-1.5 bg-muted">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">View History</p>
                      <p className="text-xs text-muted-foreground">See all impersonation activity</p>
                    </div>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Impersonation Audit Log</DialogTitle>
                  </DialogHeader>
                  <ImpersonationHistoryPanel limit={50} />
                </DialogContent>
              </Dialog>
            </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Hide Numbers Toggle Component
  const HideNumbersToggle = () => {
    const { hideNumbers, toggleHideNumbers } = useHideNumbers();
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={toggleHideNumbers}
          >
            {hideNumbers ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span className="text-xs">Show/hide $</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {hideNumbers ? 'Show numbers' : 'Hide numbers'}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:border-r lg:border-border lg:bg-card transition-[width] duration-200 ease-in-out",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <SidebarNavContent
          mainNavItems={mainNavItems}
          growthNavItems={growthNavItems}
          statsNavItems={statsNavItems}
          getHelpNavItems={getHelpNavItems}
          housekeepingNavItems={housekeepingNavItems}
          managerNavItems={managerNavItems}
          websiteNavItems={websiteNavItems}
          adminOnlyNavItems={adminOnlyNavItems}
          platformNavItems={platformNavItems}
          isPlatformUser={isPlatformUser}
          unreadCount={unreadCount}
          roles={roles}
          effectiveIsCoach={effectiveIsCoach}
          filterNavItems={filterNavItems}
          onNavClick={handleNavClick}
          isOnboardingComplete={isOnboardingComplete}
          onboardingProgress={onboardingProgress}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
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
            <SidebarNavContent
              mainNavItems={mainNavItems}
              growthNavItems={growthNavItems}
              statsNavItems={statsNavItems}
              getHelpNavItems={getHelpNavItems}
              housekeepingNavItems={housekeepingNavItems}
              managerNavItems={managerNavItems}
              websiteNavItems={websiteNavItems}
              adminOnlyNavItems={adminOnlyNavItems}
              platformNavItems={platformNavItems}
              isPlatformUser={isPlatformUser}
              unreadCount={unreadCount}
              roles={roles}
              effectiveIsCoach={effectiveIsCoach}
              filterNavItems={filterNavItems}
              onNavClick={handleNavClick}
              isOnboardingComplete={isOnboardingComplete}
              onboardingProgress={onboardingProgress}
            />
          </SheetContent>
        </Sheet>

        <Link to="/dashboard">
          {hasCustomLogo() ? (
            <img src={getLogo()} alt={businessSettings?.business_name || 'Drop Dead'} className="h-4 w-auto" />
          ) : (
            <span className="font-display text-sm uppercase tracking-wider text-foreground">
              {businessSettings?.business_name || 'Drop Dead'}
            </span>
          )}
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
              <DropdownMenuItem asChild>
                <Link to="/dashboard/notifications" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="w-4 h-4" />
                  Notification Preferences
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

      {/* Impersonation Indicator Banner */}
      <AnimatePresence>
        {isViewingAs && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 text-center text-sm font-medium lg:pl-64 overflow-hidden shadow-lg relative"
          >
            {/* Animated background pattern */}
            <motion.div 
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }}
              animate={{ backgroundPosition: ['0px 0px', '40px 0px'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex items-center justify-center gap-3 py-2.5 px-4 relative z-10"
            >
              {/* Pulsing eye indicator */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-2"
              >
                <div className="p-1.5 bg-amber-950/20 rounded-full">
                  <Eye className="w-4 h-4" />
                </div>
              </motion.div>

              {/* User/Role info */}
              <div className="flex items-center gap-2">
                {isViewingAsUser && viewAsUser ? (
                  <>
                    <Avatar className="h-6 w-6 border-2 border-amber-950/30 shadow-sm">
                      <AvatarImage src={viewAsUser.photo_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-amber-950/20 text-amber-950 font-bold">
                        {viewAsUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-semibold">{viewAsUser.full_name}</span>
                      <span className="text-[10px] text-amber-950/70">Impersonating User</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-semibold">{viewAsRole ? ROLE_LABELS[viewAsRole] : 'Unknown'}</span>
                    <span className="text-[10px] text-amber-950/70">Viewing as Role</span>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="h-6 w-px bg-amber-950/20 mx-1" />

              {/* Warning text */}
              <span className="text-xs text-amber-950/80 hidden sm:inline">
                Preview mode – Actions are read-only
              </span>

              {/* Exit button with ESC hint */}
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => clearViewAs()}
                className="h-7 px-3 bg-amber-950 text-amber-100 border-amber-950 hover:bg-amber-900 hover:text-white ml-2 gap-1.5 font-medium shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                Exit View
                <kbd className="hidden sm:inline-flex items-center justify-center h-4 px-1.5 ml-1 text-[10px] font-mono bg-amber-100/20 text-amber-100 rounded border border-amber-100/30">
                  ESC
                </kbd>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Organization Context Banner */}
      <div className={cn(
        "transition-[padding-left] duration-200 ease-in-out",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <PlatformContextBanner />
      </div>

      {/* Desktop Top Bar */}
      <div className={cn(
        "hidden lg:block sticky top-0 z-30 transition-[padding-left] duration-200 ease-in-out",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <div className="flex items-center justify-between h-12 px-6 border-b border-border bg-card/80 backdrop-blur-sm">
          {/* Left side - Sidebar toggle */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleSidebarCollapsed}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Next Client Indicator - Stylists and Assistants only */}
          {(isStylistRole || isStylistAssistantRole) && (
            <NextClientIndicator userId={isViewingAsUser && viewAsUser ? viewAsUser.id : user?.id} />
          )}
          
          {/* Right side - User controls */}
          <div className="flex items-center gap-3">
          {/* Organization Switcher - Platform users only */}
          {isPlatformUser && <OrganizationSwitcher compact />}
          {/* Hide Numbers Toggle */}
          <HideNumbersToggle />
          <Badge variant="outline" className={cn("text-xs font-medium gap-1.5", getAccessBadgeColor())}>
            <AccessIcon className="w-3 h-3" />
            {getAccessLabel()}
          </Badge>
          {isAdmin && <ViewAsToggle />}
          {/* Phorest Sync Popout - visible to admins/managers */}
          {(actualRoles.includes('admin') || actualRoles.includes('super_admin') || actualRoles.includes('manager')) && (
            <PhorestSyncPopout />
          )}
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
      </div>

      {/* Main Content */}
      <main className={cn(
        "transition-[padding-left] duration-200 ease-in-out",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <div className={cn("min-h-screen flex flex-col", isAdmin && "lg:pt-0")}>
          <div className="flex-1">
            {children}
          </div>
          {/* Dashboard Footer */}
          <footer className="py-6 text-center border-t border-border mt-auto">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Drop Dead · Powered by Drop Dead Salon Software
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

// Export wrapper component that applies scoped dark mode
export function DashboardLayout(props: DashboardLayoutProps) {
  const { resolvedTheme } = useDashboardTheme();
  const location = useLocation();
  
  // Check if we're on a platform route
  const isPlatformRoute = location.pathname.startsWith('/dashboard/platform');
  
  return (
    <div className={cn(
      resolvedTheme === 'dark' && 'dark',
      isPlatformRoute && 'platform-theme platform-gradient-radial min-h-screen'
    )}>
      <DashboardLayoutInner {...props} />
    </div>
  );
}
