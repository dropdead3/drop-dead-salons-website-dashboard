import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import { CustomCursor } from "./components/ui/CustomCursor";
import { AuthProvider } from "./contexts/AuthContext";
import { ViewAsProvider } from "./contexts/ViewAsContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

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

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import Program from "./pages/dashboard/Program";
import RingTheBell from "./pages/dashboard/RingTheBell";
import Leaderboard from "./pages/dashboard/Leaderboard";
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
import AccountApprovals from "./pages/dashboard/admin/AccountApprovals";
import StaffInvitations from "./pages/dashboard/admin/StaffInvitations";
import MyHandbooks from "./pages/dashboard/MyHandbooks";
import Onboarding from "./pages/dashboard/Onboarding";
import AssistantSchedule from "./pages/dashboard/AssistantSchedule";
import ScheduleMeeting from "./pages/dashboard/ScheduleMeeting";
import MyProfile from "./pages/dashboard/MyProfile";
import TeamDirectory from "./pages/dashboard/TeamDirectory";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewAsProvider>
          <TooltipProvider>
          <CustomCursor />
          <Toaster />
          <Sonner />
          <BrowserRouter>
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

              {/* Protected dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard.view"><DashboardHome /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute requiredPermission="profile.edit"><MyProfile /></ProtectedRoute>} />
              <Route path="/dashboard/directory" element={<ProtectedRoute requiredPermission="team.view"><TeamDirectory /></ProtectedRoute>} />
              <Route path="/dashboard/program" element={<ProtectedRoute requiredPermission="program.view"><Program /></ProtectedRoute>} />
              <Route path="/dashboard/progress" element={<ProtectedRoute requiredPermission="program.view"><Progress /></ProtectedRoute>} />
              <Route path="/dashboard/stats" element={<ProtectedRoute requiredPermission="program.view"><Stats /></ProtectedRoute>} />
              <Route path="/dashboard/leaderboard" element={<ProtectedRoute requiredPermission="leaderboard.view"><Leaderboard /></ProtectedRoute>} />
              <Route path="/dashboard/ring-the-bell" element={<ProtectedRoute requiredPermission="ring_the_bell.view"><RingTheBell /></ProtectedRoute>} />
              <Route path="/dashboard/training" element={<ProtectedRoute requiredPermission="training.view"><Training /></ProtectedRoute>} />
              <Route path="/dashboard/weekly-wins" element={<ProtectedRoute requiredPermission="program.view"><WeeklyWins /></ProtectedRoute>} />
              <Route path="/dashboard/handbooks" element={<ProtectedRoute requiredPermission="handbooks.view"><MyHandbooks /></ProtectedRoute>} />
              <Route path="/dashboard/onboarding" element={<ProtectedRoute requiredPermission="dashboard.view"><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard/assistant-schedule" element={<ProtectedRoute requiredPermission="assistant.request"><AssistantSchedule /></ProtectedRoute>} />
              <Route path="/dashboard/schedule-meeting" element={<ProtectedRoute requiredPermission="meetings.schedule"><ScheduleMeeting /></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/dashboard/admin/team" element={<ProtectedRoute requiredPermission="team.manage"><TeamOverview /></ProtectedRoute>} />
              <Route path="/dashboard/admin/handbooks" element={<ProtectedRoute requiredPermission="handbooks.manage"><Handbooks /></ProtectedRoute>} />
              <Route path="/dashboard/admin/announcements" element={<ProtectedRoute requiredPermission="announcements.manage"><AdminAnnouncements /></ProtectedRoute>} />
              <Route path="/dashboard/admin/homepage-stylists" element={<ProtectedRoute requiredPermission="homepage.manage"><HomepageStylists /></ProtectedRoute>} />
              <Route path="/dashboard/admin/roles" element={<ProtectedRoute requiredPermission="roles.manage"><ManageRoles /></ProtectedRoute>} />
              <Route path="/dashboard/admin/approvals" element={<ProtectedRoute requiredPermission="accounts.approve"><AccountApprovals /></ProtectedRoute>} />
              <Route path="/dashboard/admin/invitations" element={<ProtectedRoute requiredPermission="accounts.approve"><StaffInvitations /></ProtectedRoute>} />
              <Route path="/dashboard/admin/settings" element={<ProtectedRoute requiredPermission="settings.manage"><AdminSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </ViewAsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
