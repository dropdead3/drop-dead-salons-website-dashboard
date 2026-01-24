import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calendar, 
  TrendingUp, 
  Bell, 
  CheckSquare, 
  Target,
  ChevronRight,
  ChevronDown,
  Users,
  DollarSign,
  Clock,
  Megaphone,
  Flame,
  Pin,
  Pencil,
  Hourglass,
  HandHelping,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDailyCompletion } from '@/hooks/useDailyCompletion';
import { useTasks } from '@/hooks/useTasks';
import { useCurrentUserApprovalStatus } from '@/hooks/useAccountApproval';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { VisibilityGate } from '@/components/visibility';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';
import { StylistsOverviewCard, StaffOverviewCard } from '@/components/dashboard/StylistsOverviewCard';
import { TodaysBirthdayBanner } from '@/components/dashboard/TodaysBirthdayBanner';
import { WidgetsSection } from '@/components/dashboard/WidgetsSection';
import { WorkScheduleWidget } from '@/components/dashboard/WorkScheduleWidget';
import { ScheduleRequestsCard } from '@/components/dashboard/ScheduleRequestsCard';
import { useBirthdayNotifications } from '@/hooks/useBirthdayNotifications';
import { WebsiteAnalyticsWidget } from '@/components/dashboard/WebsiteAnalyticsWidget';
import { OnboardingTrackerOverview } from '@/components/dashboard/OnboardingTrackerOverview';
import { ClientEngineOverview } from '@/components/dashboard/ClientEngineOverview';
import { AnnouncementsBento } from '@/components/dashboard/AnnouncementsBento';
import { AggregateSalesCard } from '@/components/dashboard/AggregateSalesCard';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  is_pinned: boolean;
  created_at: string;
  link_url: string | null;
  link_label: string | null;
}

const priorityColors: Record<Priority, string> = {
  low: 'border-muted-foreground',
  normal: 'border-blue-500',
  high: 'border-orange-500',
  urgent: 'border-red-500',
};

const normalizeUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export default function DashboardHome() {
  const { user } = useAuth();
  const roles = useEffectiveRoles();
  const { enrollment } = useDailyCompletion(user?.id);
  const { tasks, createTask, toggleTask, deleteTask, isImpersonating } = useTasks();
  const { data: approvalStatus } = useCurrentUserApprovalStatus();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  
  // Birthday notifications for leadership
  useBirthdayNotifications();
  
  // Leadership team: super admin and manager only (not regular admin or assistants)
  const isLeadership = profile?.is_super_admin || 
    roles.includes('super_admin') || 
    roles.includes('manager');
  
  // Top-level access: account owner (primary owner), super admin, and DOO (admin role) only
  // Used for sensitive analytics like Website Traffic
  const isTopLeadership = profile?.is_primary_owner || 
    profile?.is_super_admin || 
    roles.includes('super_admin') ||
    roles.includes('admin');
  
  // Check if user has stylist or stylist_assistant roles (for Quick Actions visibility)
  const hasStylistRole = roles.includes('stylist') || roles.includes('stylist_assistant');
  
  // Quick Actions should only show for stylists/assistants, or leadership who also have stylist roles
  const showQuickActions = hasStylistRole || (!isLeadership);
  
  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Mark announcements as read when they're displayed
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.id || !announcements || announcements.length === 0) return;

      // Get already read announcements
      const { data: existingReads } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      const readIds = new Set(existingReads?.map(r => r.announcement_id) || []);
      
      // Filter to only unread announcements
      const unreadAnnouncements = announcements.filter(a => !readIds.has(a.id));
      
      if (unreadAnnouncements.length === 0) return;

      // Mark all displayed announcements as read
      const { error } = await supabase
        .from('announcement_reads')
        .insert(
          unreadAnnouncements.map(a => ({
            announcement_id: a.id,
            user_id: user.id,
          }))
        );

      if (!error) {
        // Invalidate the unread count query to update badges
        queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
      }
    };

    markAsRead();
  }, [announcements, user?.id, queryClient]);
  
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Pending Approval Banner */}
        {approvalStatus?.is_approved === false && (
          <Alert className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-700">
            <Hourglass className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200 font-display">
              Account Pending Approval
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Your account is waiting for admin approval. Some features may be limited until your account is approved. 
              If you've been waiting a while, please contact your manager.
            </AlertDescription>
          </Alert>
        )}

        {/* Today's Birthday Banner - visible to all */}
        <TodaysBirthdayBanner />


        {/* Header */}
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground font-sans">
            Here's what's happening today
          </p>
        </div>

        {/* Quick Actions - FIRST for stylists/assistants */}
        {showQuickActions && (
          <VisibilityGate elementKey="quick_actions">
            <div>
              <h2 className="font-display text-sm tracking-wide mb-4">QUICK ACTIONS</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <VisibilityGate elementKey="ring_the_bell_action">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link to="/dashboard/ring-the-bell">
                      <Bell className="w-5 h-5" />
                      <span className="text-xs">Ring the Bell</span>
                    </Link>
                  </Button>
                </VisibilityGate>
                <VisibilityGate elementKey="log_metrics_action">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link to="/dashboard/stats">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-xs">Log Metrics</span>
                    </Link>
                  </Button>
                </VisibilityGate>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link to="/dashboard/my-clients">
                    <Users className="w-5 h-5" />
                    <span className="text-xs">My Clients</span>
                  </Link>
                </Button>
                {/* Request Assistant - only for stylists, not assistants */}
                {roles.includes('stylist') && (
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link to="/dashboard/assistant-schedule">
                      <HandHelping className="w-5 h-5" />
                      <span className="text-xs">Request Assistant</span>
                    </Link>
                  </Button>
                )}
                <VisibilityGate elementKey="training_action">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                    <Link to="/dashboard/training">
                      <Target className="w-5 h-5" />
                      <span className="text-xs">Training</span>
                    </Link>
                  </Button>
                </VisibilityGate>
              </div>
            </div>
          </VisibilityGate>
        )}

        {/* Aggregate Sales Overview - Leadership Only */}
        {isLeadership && (
          <VisibilityGate elementKey="sales_overview">
            <AggregateSalesCard />
          </VisibilityGate>
        )}

        {/* Quick Stats - Non-leadership only */}
        {!isLeadership && (
          <VisibilityGate elementKey="quick_stats">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-display">0</p>
                    <p className="text-xs text-muted-foreground font-sans">Today's Clients</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-display">$0</p>
                    <p className="text-xs text-muted-foreground font-sans">This Week</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-display">0</p>
                    <p className="text-xs text-muted-foreground font-sans">New Clients</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-display">0%</p>
                    <p className="text-xs text-muted-foreground font-sans">Rebooking Rate</p>
                  </div>
                </div>
              </Card>
            </div>
          </VisibilityGate>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Schedule & Appointments */}
          <VisibilityGate elementKey="todays_schedule">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-sm tracking-wide">TODAY'S SCHEDULE</h2>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-sans">No appointments today</p>
                  <p className="text-xs mt-1">Enjoy your day off!</p>
                </div>
              </div>
            </Card>
          </VisibilityGate>

          {/* Tasks & To-Dos */}
          <VisibilityGate elementKey="my_tasks">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm tracking-wide">MY TASKS</h2>
                  {isImpersonating && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      View Only
                    </span>
                  )}
                </div>
                <AddTaskDialog 
                  onAdd={(task) => createTask.mutate(task)} 
                  isPending={createTask.isPending} 
                  isReadOnly={isImpersonating}
                />
              </div>
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.slice(0, 5).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={(id, completed) => toggleTask.mutate({ id, is_completed: completed })}
                      onDelete={(id) => deleteTask.mutate(id)}
                      isReadOnly={isImpersonating}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-sans">No tasks yet</p>
                    <p className="text-xs mt-1">{isImpersonating ? 'This user has no tasks' : 'Add your first task above'}</p>
                  </div>
                )}
              </div>
              {tasks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  +{tasks.length - 5} more tasks
                </p>
              )}
            </Card>
          </VisibilityGate>
        </div>

        {/* Announcements - Full Width Bento */}
        <VisibilityGate elementKey="announcements">
          <AnnouncementsBento 
            announcements={announcements} 
            isLeadership={isLeadership} 
          />
        </VisibilityGate>

        {/* Drop Dead 75 Program Section */}
        {/* Client Engine - only show for stylists/assistants */}
        {hasStylistRole && (
          <VisibilityGate elementKey="client_engine">
            <div className="relative group">
              {/* Gold shimmer border effect */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[hsl(45,60%,70%)] via-[hsl(40,50%,85%)] to-[hsl(45,60%,70%)] opacity-60 blur-[0.5px]" />
              <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                <div className="gold-shimmer" />
              </div>
              
              <Card className="relative p-6 rounded-2xl bg-gradient-to-br from-[hsl(40,30%,95%)] via-[hsl(45,25%,92%)] to-[hsl(40,20%,85%)] border border-[hsl(45,50%,75%)]/50 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-[hsl(40,40%,30%)] to-[hsl(35,35%,20%)] text-[hsl(45,50%,85%)] flex items-center justify-center rounded-lg shadow-md">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-lg tracking-wide text-[hsl(35,30%,20%)]">CLIENT ENGINE</h2>
                          {enrollment && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span className="font-display text-[hsl(35,30%,20%)]">{enrollment.streak_count} DAY STREAK</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-[hsl(35,20%,40%)] font-sans">
                          75 days of execution. No excuses.
                        </p>
                      </div>
                    </div>
                    
                    {enrollment ? (
                      <div className="mt-3">
                        <p className="text-sm font-sans text-[hsl(35,20%,40%)]">
                          You're on <span className="text-[hsl(35,30%,20%)] font-medium">Day {enrollment.current_day}</span> of 75
                        </p>
                        <div className="w-full max-w-xs h-2 bg-[hsl(40,20%,80%)] mt-2 overflow-hidden rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-[hsl(40,50%,45%)] to-[hsl(45,60%,55%)] transition-all rounded-full" 
                            style={{ width: `${(enrollment.current_day / 75) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-sans text-[hsl(35,20%,40%)] mt-1">
                        Ready to transform your book? Start the challenge today.
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-[hsl(40,40%,25%)] to-[hsl(35,35%,15%)] hover:from-[hsl(40,45%,30%)] hover:to-[hsl(35,40%,20%)] text-[hsl(45,50%,90%)] border border-[hsl(45,50%,60%)]/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] px-8 shrink-0"
                  >
                    <Link to="/dashboard/program">
                      {enrollment ? 'Continue Today' : 'Start Program'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </VisibilityGate>
        )}

        {/* Widgets Section */}
        <WidgetsSection />

        {/* Top Leadership-only: Website Analytics (account owner, super admin, DOO) */}
        {isTopLeadership && (
          <VisibilityGate elementKey="website_analytics">
            <WebsiteAnalyticsWidget />
          </VisibilityGate>
        )}
        
        {isLeadership && (
          <div className="grid gap-6 lg:grid-cols-2">
            <VisibilityGate elementKey="client_engine_overview">
              <ClientEngineOverview />
            </VisibilityGate>
            <VisibilityGate elementKey="onboarding_overview">
              <OnboardingTrackerOverview />
            </VisibilityGate>
          </div>
        )}

        {/* Leadership-only: Team & Stylists Overview + Schedule Requests */}
        {isLeadership && (
          <div className="grid gap-6 lg:grid-cols-2">
            <VisibilityGate elementKey="team_overview">
              <StaffOverviewCard />
            </VisibilityGate>
            <VisibilityGate elementKey="stylists_overview">
              <StylistsOverviewCard />
            </VisibilityGate>
            <ScheduleRequestsCard />
          </div>
        )}


      </div>
    </DashboardLayout>
  );
}

