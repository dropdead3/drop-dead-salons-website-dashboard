import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  Bell, 
  CheckSquare, 
  Target,
  ChevronRight,
  Users,
  DollarSign,
  Clock,
  Megaphone,
  Flame,
  Pin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDailyCompletion } from '@/hooks/useDailyCompletion';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  is_pinned: boolean;
  created_at: string;
}

const priorityColors: Record<Priority, string> = {
  low: 'border-muted-foreground',
  normal: 'border-blue-500',
  high: 'border-orange-500',
  urgent: 'border-red-500',
};

export default function DashboardHome() {
  const { user } = useAuth();
  const { enrollment } = useDailyCompletion(user?.id);
  const { tasks, createTask, toggleTask, deleteTask } = useTasks();
  const queryClient = useQueryClient();
  
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
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground font-sans">
            Here's what's happening today
          </p>
        </div>

        {/* Quick Stats */}
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Schedule & Appointments */}
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

          {/* Tasks & To-Dos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-wide">MY TASKS</h2>
              <AddTaskDialog onAdd={(task) => createTask.mutate(task)} isPending={createTask.isPending} />
            </div>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={(id, completed) => toggleTask.mutate({ id, is_completed: completed })}
                    onDelete={(id) => deleteTask.mutate(id)}
                  />
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-sans">No tasks yet</p>
                  <p className="text-xs mt-1">Add your first task above</p>
                </div>
              )}
            </div>
            {tasks.length > 5 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                +{tasks.length - 5} more tasks
              </p>
            )}
          </Card>

          {/* Announcements */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-wide">ANNOUNCEMENTS</h2>
              <Megaphone className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {announcements && announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div 
                    key={announcement.id}
                    className={`p-3 bg-muted/50 border-l-2 ${priorityColors[announcement.priority]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {announcement.is_pinned && <Pin className="w-3 h-3" />}
                      <p className="text-sm font-sans font-medium">{announcement.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {format(new Date(announcement.created_at), 'MMM d')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-muted/50 border-l-2 border-foreground">
                  <p className="text-sm font-sans font-medium">Welcome to Drop Dead!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete your onboarding to get started
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Drop Dead 75 Program Section */}
        <Card className="p-6 border-2 border-foreground/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-lg tracking-wide">DROP DEAD 75</h2>
                <p className="text-sm text-muted-foreground font-sans">
                  75 days of execution. No excuses.
                </p>
              </div>
            </div>
            {enrollment && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-display">{enrollment.streak_count} day streak</span>
              </div>
            )}
          </div>
          
          {enrollment ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-sans text-muted-foreground">
                  You're on <span className="text-foreground font-medium">Day {enrollment.current_day}</span> of 75
                </p>
                <div className="w-48 h-2 bg-muted mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-foreground transition-all" 
                    style={{ width: `${(enrollment.current_day / 75) * 100}%` }}
                  />
                </div>
              </div>
              <Button asChild>
                <Link to="/dashboard/program">
                  Continue Today
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-sans text-muted-foreground">
                Ready to transform your book? Start the challenge today.
              </p>
              <Button asChild>
                <Link to="/dashboard/program">
                  Start Program
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-sm tracking-wide mb-4">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/ring-the-bell">
                <Bell className="w-5 h-5" />
                <span className="text-xs">Ring the Bell</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/stats">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Log Metrics</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/training">
                <Target className="w-5 h-5" />
                <span className="text-xs">Training</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/dashboard/handbooks">
                <CheckSquare className="w-5 h-5" />
                <span className="text-xs">Handbooks</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

