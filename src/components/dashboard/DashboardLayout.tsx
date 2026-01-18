import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
} from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const stylistNavItems = [
  { href: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: Users },
  { href: '/dashboard/progress', label: 'Progress', icon: Target },
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3 },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/ring-the-bell', label: 'Ring the Bell', icon: Bell },
  { href: '/dashboard/training', label: 'Training', icon: Video },
  { href: '/dashboard/handbooks', label: 'Handbooks', icon: FileText },
];

const coachNavItems = [
  { href: '/dashboard/admin/team', label: 'Team Overview', icon: Users },
  { href: '/dashboard/admin/handbooks', label: 'Handbooks', icon: FileText },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isCoach, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/staff-login');
  };

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
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
        {label}
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
          Drop Dead 75
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1">
          {stylistNavItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {isCoach && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <p className="px-4 mb-2 text-xs uppercase tracking-wider text-muted-foreground font-display">
              Admin
            </p>
            <div className="space-y-1">
              {coachNavItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-muted flex items-center justify-center text-sm font-display">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-sans truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {isCoach ? 'Coach' : 'Stylist'}
            </p>
          </div>
        </div>
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

        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
