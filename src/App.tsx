import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "./components/ScrollToTop";
import { CustomCursor } from "./components/ui/CustomCursor";
import { AuthProvider } from "./contexts/AuthContext";
import { ViewAsProvider } from "./contexts/ViewAsContext";
import { HideNumbersProvider } from "./contexts/HideNumbersContext";
import { DashboardThemeProvider } from "./contexts/DashboardThemeContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ThemeInitializer } from "./components/ThemeInitializer";

// Public pages
import Index from "./pages/Index";
import Services from "./pages/Services";
import About from "./pages/About";
import Booking from "./pages/Booking";
import Stylists from "./pages/Stylists";
import Extensions from "./pages/Extensions";
import Policies from "./pages/Policies";
import NotFound from "./pages/NotFound";
import StaffLogin from "./pages/StaffLogin";
import PlatformLogin from "./pages/PlatformLogin";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import Program from "./pages/dashboard/Program";
import RingTheBell from "./pages/dashboard/RingTheBell";
// Leaderboard is now part of Stats page
import Training from "./pages/dashboard/Training";
import Progress from "./pages/dashboard/Progress";
import Stats from "./pages/dashboard/Stats";
import WeeklyWins from "./pages/dashboard/WeeklyWins";
import TeamOverview from "./pages/dashboard/admin/TeamOverview";
import Handbooks from "./pages/dashboard/admin/Handbooks";
import AdminSettings from "./pages/dashboard/admin/Settings";
import AdminAnnouncements from "./pages/dashboard/admin/Announcements";
import HomepageStylists from "./pages/dashboard/admin/HomepageStylists";
import ManageRoles from "./pages/dashboard/admin/ManageRoles";
import AccountManagement from "./pages/dashboard/admin/AccountManagement";
import TestimonialsManager from "./pages/dashboard/admin/TestimonialsManager";
import ServicesManager from "./pages/dashboard/admin/ServicesManager";
import AnnouncementBarManager from "./pages/dashboard/admin/AnnouncementBarManager";
import StylistLevels from "./pages/dashboard/admin/StylistLevels";
import LocationsManager from "./pages/dashboard/admin/LocationsManager";
import WebsiteSectionsHub from "./pages/dashboard/admin/WebsiteSectionsHub";

import TeamBirthdays from "./pages/dashboard/admin/TeamBirthdays";
import StaffStrikes from "./pages/dashboard/admin/StaffStrikes";
import BusinessCardRequests from "./pages/dashboard/admin/BusinessCardRequests";
import HeadshotRequests from "./pages/dashboard/admin/HeadshotRequests";
import MyHandbooks from "./pages/dashboard/MyHandbooks";
import Onboarding from "./pages/dashboard/Onboarding";
import AssistantSchedule from "./pages/dashboard/AssistantSchedule";
import ScheduleMeeting from "./pages/dashboard/ScheduleMeeting";
import MyProfile from "./pages/dashboard/MyProfile";
import ViewProfile from "./pages/dashboard/ViewProfile";
import TeamDirectory from "./pages/dashboard/TeamDirectory";
import NotificationPreferences from "./pages/dashboard/NotificationPreferences";
import OnboardingTracker from "./pages/dashboard/admin/OnboardingTracker";
import ClientEngineTracker from "./pages/dashboard/admin/ClientEngineTracker";
import AssistantRequestsOverview from "./pages/dashboard/admin/AssistantRequestsOverview";
import ScheduleRequests from "./pages/dashboard/admin/ScheduleRequests";
import DashboardBuild from "./pages/dashboard/admin/DashboardBuild";
import RecruitingPipeline from "./pages/dashboard/admin/RecruitingPipeline";
import GraduationTracker from "./pages/dashboard/admin/GraduationTracker";
import MyGraduation from "./pages/dashboard/MyGraduation";
import DesignSystem from "./pages/dashboard/DesignSystem";
import ProgramEditor from "./pages/dashboard/admin/ProgramEditor";
import PhorestSettings from "./pages/dashboard/admin/PhorestSettings";
import AnalyticsHub from "./pages/dashboard/admin/AnalyticsHub";
import LeadManagement from "./pages/dashboard/admin/LeadManagement";
import FeatureFlags from "./pages/dashboard/admin/FeatureFlags";
import MyClients from "./pages/dashboard/MyClients";
import Schedule from "./pages/dashboard/Schedule";
import AllNotifications from "./pages/dashboard/AllNotifications";
import Changelog from "./pages/dashboard/Changelog";
import ChangelogManager from "./pages/dashboard/admin/ChangelogManager";
import MetricsGlossary from "./pages/dashboard/MetricsGlossary";
import PublicBooking from "./pages/PublicBooking";
import DayRateBooking from "./pages/DayRateBooking";
import DayRateSettings from "./pages/dashboard/admin/DayRateSettings";
import DayRateCalendar from "./pages/dashboard/admin/DayRateCalendar";
import DataImport from "./pages/dashboard/admin/DataImport";
import Payroll from "./pages/dashboard/admin/Payroll";
import PayrollCallback from "./pages/dashboard/admin/PayrollCallback";
import HelpCenter from "./pages/dashboard/HelpCenter";
import MyPay from "./pages/dashboard/MyPay";
import Transactions from "./pages/dashboard/Transactions";
import Inventory from "./pages/dashboard/Inventory";
import Register from "./pages/dashboard/Register";

// Platform Admin pages
import PlatformOverview from "./pages/dashboard/platform/Overview";
import PlatformAccounts from "./pages/dashboard/platform/Accounts";
import AccountDetail from "./pages/dashboard/platform/AccountDetail";
import PlatformImport from "./pages/dashboard/platform/PlatformImport";
import PlatformSettings from "./pages/dashboard/platform/PlatformSettings";
import PlatformRevenue from "./pages/dashboard/platform/Revenue";
import PlatformPermissions from "./pages/dashboard/platform/Permissions";
import PlatformIntegrationDetail from "./pages/dashboard/platform/PlatformIntegrationDetail";
import PlatformKnowledgeBase from "./pages/dashboard/platform/KnowledgeBase";
import PlatformOnboarding from "./pages/dashboard/platform/Onboarding";
import PlatformAnalytics from "./pages/dashboard/platform/Analytics";
import AuditLogPage from "./pages/dashboard/platform/AuditLog";
import JobsPage from "./pages/dashboard/platform/Jobs";
import SystemHealthPage from "./pages/dashboard/platform/SystemHealth";
import StripeHealthPage from "./pages/dashboard/platform/StripeHealth";
import NotificationsPage from "./pages/dashboard/platform/Notifications";
import { PlatformLayout } from "./components/platform/layout/PlatformLayout";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeInitializer />
          <OrganizationProvider>
            <DashboardThemeProvider>
              <ViewAsProvider>
                <HideNumbersProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <CustomCursor />
                      <ScrollToTop />
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/booking" element={<Booking />} />
                      <Route path="/stylists" element={<Stylists />} />
                      <Route path="/extensions" element={<Extensions />} />
                      <Route path="/policies" element={<Policies />} />
                      <Route path="/staff-login" element={<StaffLogin />} />
                      <Route path="/platform-login" element={<PlatformLogin />} />
                      <Route path="/book" element={<PublicBooking />} />
                      <Route path="/day-rate" element={<DayRateBooking />} />

                      {/* Protected dashboard routes */}
                      <Route path="/dashboard" element={<ProtectedRoute requiredPermission="view_command_center"><DashboardHome /></ProtectedRoute>} />
                      <Route path="/dashboard/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
                      <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                      <Route path="/dashboard/notifications/all" element={<ProtectedRoute><AllNotifications /></ProtectedRoute>} />
                      <Route path="/dashboard/profile/:userId" element={<ProtectedRoute requiredPermission="view_any_profile"><ViewProfile /></ProtectedRoute>} />
                      <Route path="/dashboard/directory" element={<ProtectedRoute requiredPermission="view_team_directory"><TeamDirectory /></ProtectedRoute>} />
                      <Route path="/dashboard/program" element={<ProtectedRoute requiredPermission="access_client_engine"><Program /></ProtectedRoute>} />
                      <Route path="/dashboard/progress" element={<ProtectedRoute requiredPermission="access_client_engine"><Progress /></ProtectedRoute>} />
                      <Route path="/dashboard/stats" element={<ProtectedRoute requiredPermission="view_own_stats"><Stats /></ProtectedRoute>} />
                      <Route path="/dashboard/leaderboard" element={<Navigate to="/dashboard/stats?tab=leaderboard" replace />} />
                      <Route path="/dashboard/ring-the-bell" element={<ProtectedRoute requiredPermission="ring_the_bell"><RingTheBell /></ProtectedRoute>} />
                      <Route path="/dashboard/training" element={<ProtectedRoute requiredPermission="view_training"><Training /></ProtectedRoute>} />
                      <Route path="/dashboard/weekly-wins" element={<ProtectedRoute requiredPermission="access_client_engine"><WeeklyWins /></ProtectedRoute>} />
                      <Route path="/dashboard/handbooks" element={<ProtectedRoute requiredPermission="view_handbooks"><MyHandbooks /></ProtectedRoute>} />
                      <Route path="/dashboard/onboarding" element={<ProtectedRoute requiredPermission="view_onboarding"><Onboarding /></ProtectedRoute>} />
                      <Route path="/dashboard/assistant-schedule" element={<ProtectedRoute requiredPermission="view_assistant_schedule"><AssistantSchedule /></ProtectedRoute>} />
                      <Route path="/dashboard/schedule-meeting" element={<ProtectedRoute requiredPermission="schedule_meetings"><ScheduleMeeting /></ProtectedRoute>} />
                      <Route path="/dashboard/my-graduation" element={<ProtectedRoute requiredPermission="view_my_graduation"><MyGraduation /></ProtectedRoute>} />
                      <Route path="/dashboard/my-clients" element={<ProtectedRoute requiredPermission="view_own_stats"><MyClients /></ProtectedRoute>} />
                      <Route path="/dashboard/my-pay" element={<ProtectedRoute requiredPermission="view_my_pay"><MyPay /></ProtectedRoute>} />
                      <Route path="/dashboard/schedule" element={<ProtectedRoute requiredPermission="view_booking_calendar"><Schedule /></ProtectedRoute>} />
                      <Route path="/dashboard/changelog" element={<ProtectedRoute><Changelog /></ProtectedRoute>} />
                      <Route path="/dashboard/metrics-glossary" element={<ProtectedRoute><MetricsGlossary /></ProtectedRoute>} />
                      <Route path="/dashboard/design-system" element={<ProtectedRoute requiredPermission="manage_settings"><DesignSystem /></ProtectedRoute>} />
                      <Route path="/dashboard/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
                      <Route path="/dashboard/help/:categorySlug" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
                      <Route path="/dashboard/help/:categorySlug/:articleSlug" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
                      
                      {/* Admin routes */}
                      <Route path="/dashboard/admin/team" element={<ProtectedRoute requiredPermission="view_team_overview"><TeamOverview /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/strikes" element={<ProtectedRoute requiredPermission="manage_user_roles"><StaffStrikes /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/birthdays" element={<ProtectedRoute requiredPermission="view_team_overview"><TeamBirthdays /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/onboarding-tracker" element={<ProtectedRoute requiredPermission="view_team_overview"><OnboardingTracker /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/client-engine-tracker" element={<ProtectedRoute requiredPermission="view_team_overview"><ClientEngineTracker /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/assistant-requests" element={<ProtectedRoute requiredPermission="view_team_overview"><AssistantRequestsOverview /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/schedule-requests" element={<ProtectedRoute requiredPermission="manage_schedule_requests"><ScheduleRequests /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/handbooks" element={<ProtectedRoute requiredPermission="manage_handbooks"><Handbooks /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/announcements" element={<ProtectedRoute requiredPermission="manage_announcements"><AdminAnnouncements /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/homepage-stylists" element={<Navigate to="/dashboard/admin/website-sections?tab=stylists" replace />} />
                      <Route path="/dashboard/admin/testimonials" element={<Navigate to="/dashboard/admin/website-sections?tab=testimonials" replace />} />
                      <Route path="/dashboard/admin/gallery" element={<Navigate to="/dashboard/admin/website-sections?tab=gallery" replace />} />
                      <Route path="/dashboard/admin/services" element={<Navigate to="/dashboard/admin/website-sections?tab=services" replace />} />
                      <Route path="/dashboard/admin/announcement-bar" element={<Navigate to="/dashboard/admin/website-sections?tab=banner" replace />} />
                      <Route path="/dashboard/admin/locations" element={<Navigate to="/dashboard/admin/website-sections?tab=locations" replace />} />
                      <Route path="/dashboard/admin/website-sections" element={<ProtectedRoute requiredPermission="manage_homepage_stylists"><WebsiteSectionsHub /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/roles" element={<ProtectedRoute requiredPermission="manage_user_roles"><ManageRoles /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/accounts" element={<ProtectedRoute requiredPermission="approve_accounts"><AccountManagement /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/stylist-levels" element={<ProtectedRoute requiredPermission="manage_settings"><StylistLevels /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/settings" element={<ProtectedRoute requiredPermission="manage_settings"><AdminSettings /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/business-cards" element={<ProtectedRoute requiredPermission="manage_settings"><BusinessCardRequests /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/headshots" element={<ProtectedRoute requiredPermission="manage_settings"><HeadshotRequests /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/build" element={<ProtectedRoute requiredPermission="view_dashboard_build"><DashboardBuild /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/recruiting" element={<ProtectedRoute requiredPermission="manage_user_roles"><RecruitingPipeline /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/graduation-tracker" element={<ProtectedRoute requiredPermission="view_team_overview"><GraduationTracker /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/program-editor" element={<ProtectedRoute requiredPermission="manage_program_editor"><ProgramEditor /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/phorest" element={<ProtectedRoute requiredPermission="manage_settings"><PhorestSettings /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/day-rate-settings" element={<ProtectedRoute requiredPermission="manage_settings"><DayRateSettings /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/day-rate-calendar" element={<ProtectedRoute requiredPermission="manage_settings"><DayRateCalendar /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/analytics" element={<ProtectedRoute requiredPermission="view_team_overview"><AnalyticsHub /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/sales" element={<Navigate to="/dashboard/admin/analytics?tab=sales" replace />} />
                      <Route path="/dashboard/admin/operational-analytics" element={<Navigate to="/dashboard/admin/analytics?tab=operations" replace />} />
                      <Route path="/dashboard/admin/staff-utilization" element={<Navigate to="/dashboard/admin/analytics?tab=operations&subtab=staff-utilization" replace />} />
                      <Route path="/dashboard/admin/marketing" element={<Navigate to="/dashboard/admin/analytics?tab=marketing" replace />} />
                      <Route path="/dashboard/admin/program-analytics" element={<Navigate to="/dashboard/admin/analytics?tab=program" replace />} />
                      <Route path="/dashboard/admin/reports" element={<Navigate to="/dashboard/admin/analytics?tab=reports" replace />} />
                      <Route path="/dashboard/admin/leads" element={<ProtectedRoute requiredPermission="view_team_overview"><LeadManagement /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/feature-flags" element={<ProtectedRoute requiredPermission="manage_settings"><FeatureFlags /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/changelog" element={<ProtectedRoute requiredPermission="manage_announcements"><ChangelogManager /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/import" element={<ProtectedRoute requiredPermission="manage_settings"><DataImport /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/payroll" element={<ProtectedRoute requiredPermission="manage_payroll"><Payroll /></ProtectedRoute>} />
                      <Route path="/dashboard/admin/payroll/callback" element={<ProtectedRoute requiredPermission="manage_payroll"><PayrollCallback /></ProtectedRoute>} />
                      <Route path="/dashboard/transactions" element={<ProtectedRoute requiredPermission="view_transactions"><Transactions /></ProtectedRoute>} />
                      <Route path="/dashboard/inventory" element={<ProtectedRoute requiredPermission="manage_inventory"><Inventory /></ProtectedRoute>} />
                      <Route path="/dashboard/register" element={<ProtectedRoute requiredPermission="process_retail_sales"><Register /></ProtectedRoute>} />

                      {/* Platform Admin routes - nested under PlatformLayout with sidebar */}
                      <Route path="/dashboard/platform" element={<ProtectedRoute requireAnyPlatformRole><PlatformLayout /></ProtectedRoute>}>
                        <Route path="overview" element={<PlatformOverview />} />
                        <Route path="accounts" element={<PlatformAccounts />} />
                        <Route path="accounts/:orgId" element={<AccountDetail />} />
                        <Route path="onboarding" element={<PlatformOnboarding />} />
                        <Route path="import" element={<PlatformImport />} />
                        <Route path="audit-log" element={<AuditLogPage />} />
                        <Route path="jobs" element={<JobsPage />} />
                        <Route path="health" element={<SystemHealthPage />} />
                        <Route path="stripe-health" element={<StripeHealthPage />} />
                        <Route path="notifications" element={<ProtectedRoute requirePlatformRole="platform_admin"><NotificationsPage /></ProtectedRoute>} />
                        <Route path="analytics" element={<ProtectedRoute requirePlatformRole="platform_owner"><PlatformAnalytics /></ProtectedRoute>} />
                        <Route path="knowledge-base" element={<ProtectedRoute requirePlatformRole="platform_admin"><PlatformKnowledgeBase /></ProtectedRoute>} />
                        <Route path="revenue" element={<ProtectedRoute requirePlatformRole="platform_admin"><PlatformRevenue /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute requirePlatformRole="platform_admin"><PlatformSettings /></ProtectedRoute>} />
                        <Route path="settings/integrations/:integrationId" element={<ProtectedRoute requirePlatformRole="platform_admin"><PlatformIntegrationDetail /></ProtectedRoute>} />
                        <Route path="permissions" element={<ProtectedRoute requirePlatformRole="platform_admin"><PlatformPermissions /></ProtectedRoute>} />
                      </Route>

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </HideNumbersProvider>
              </ViewAsProvider>
            </DashboardThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
