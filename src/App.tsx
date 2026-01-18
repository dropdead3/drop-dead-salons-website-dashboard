import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import { CustomCursor } from "./components/ui/CustomCursor";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Services from "./pages/Services";
import About from "./pages/About";
import Booking from "./pages/Booking";
import Stylists from "./pages/Stylists";
import Extensions from "./pages/Extensions";
import NotFound from "./pages/NotFound";
import StaffLogin from "./pages/StaffLogin";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import RingTheBell from "./pages/dashboard/RingTheBell";
import Leaderboard from "./pages/dashboard/Leaderboard";
import Training from "./pages/dashboard/Training";
import Progress from "./pages/dashboard/Progress";
import Stats from "./pages/dashboard/Stats";
import WeeklyWins from "./pages/dashboard/WeeklyWins";
import TeamOverview from "./pages/dashboard/admin/TeamOverview";
import Handbooks from "./pages/dashboard/admin/Handbooks";
import AdminSettings from "./pages/dashboard/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              <Route path="/staff-login" element={<StaffLogin />} />

              {/* Protected dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
              <Route path="/dashboard/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
              <Route path="/dashboard/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
              <Route path="/dashboard/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/dashboard/ring-the-bell" element={<ProtectedRoute><RingTheBell /></ProtectedRoute>} />
              <Route path="/dashboard/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
              <Route path="/dashboard/weekly-wins" element={<ProtectedRoute><WeeklyWins /></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/dashboard/admin/team" element={<ProtectedRoute requireCoach><TeamOverview /></ProtectedRoute>} />
              <Route path="/dashboard/admin/handbooks" element={<ProtectedRoute requireCoach><Handbooks /></ProtectedRoute>} />
              <Route path="/dashboard/admin/settings" element={<ProtectedRoute requireCoach><AdminSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
